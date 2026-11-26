import { SignJWT, jwtVerify } from "jose";
import type { NextRequest, NextResponse } from "next/server";
import { connectDB } from "./db";
import { forbidden, unauthorized } from "./errors";
import { User } from "@/models";

export const AUTH_COOKIE = "voltcraft_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type Role = "customer" | "admin";
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  isAdmin: boolean;
}

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error("JWT_SECRET must be set (min 16 chars).");
  return new TextEncoder().encode(s);
}

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(AUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** Returns the logged-in user, or null. Role is re-read from DB on every call. */
export async function getCurrentUser(req: NextRequest): Promise<AuthUser | null> {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const userId = await verifyToken(token);
  if (!userId) return null;

  await connectDB();
  const u = await User.findById(userId).select("name email roles status").lean();
  if (!u || u.status !== "active") return null;

  const roles = (u.roles ?? []) as Role[];
  return { id: String(u._id), name: u.name, email: u.email, roles, isAdmin: roles.includes("admin") };
}

export async function requireUser(req: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(req);
  if (!user) throw unauthorized();
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<AuthUser> {
  const user = await requireUser(req);
  if (!user.isAdmin) throw forbidden("ต้องเป็นผู้ดูแลระบบ (admin)");
  return user;
}
