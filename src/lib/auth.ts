import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { AppError } from './errors';

export type UserRole = 'customer' | 'admin';

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
  name?: string;
}

export const AUTH_COOKIE_NAME = 'voltcraft_token';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET environment variable');
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(payload: AuthUser): Promise<string> {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    name: payload.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (!payload.sub || typeof payload.email !== 'string') {
      return null;
    }

    const role = payload.role;
    if (role !== 'customer' && role !== 'admin') {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role,
      name: typeof payload.name === 'string' ? payload.name : undefined,
    };
  } catch {
    return null;
  }
}

export function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS,
  });
}

export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function getCurrentUser(req: NextRequest): Promise<AuthUser | null> {
  const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : undefined;

  const token = cookieToken || bearerToken;
  if (!token) {
    return null;
  }

  return verifyAuthToken(token);
}

export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(req);
  if (!user) {
    throw new AppError('Authentication required', 401);
  }
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(req);
  if (user.role !== 'admin') {
    throw new AppError('Admin access required', 403);
  }
  return user;
}