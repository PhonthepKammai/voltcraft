import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { conflict, notFound, unauthorized } from "@/lib/errors";
import { str, optStr } from "@/lib/validate";
import { badRequest } from "@/lib/errors";
import { User } from "@/models";

type UserLike = {
  _id: unknown; name: string; email: string; phone?: string | null;
  roles?: string[]; status?: string | null; addresses?: unknown[];
};

/** Public shape. `role` (primary) is kept for the existing frontend; `roles` is the DB truth. */
export function toPublicUser(u: UserLike) {
  const roles = u.roles ?? ["customer"];
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    phone: u.phone ?? undefined,
    role: roles.includes("admin") ? "admin" : "customer",
    roles,
    status: u.status ?? "active",
    addresses: u.addresses ?? [],
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerCustomer(input: { name?: unknown; email?: unknown; password?: unknown; phone?: unknown }) {
  const name = str(input.name, "ชื่อ", { max: 100 });
  const email = str(input.email, "อีเมล").toLowerCase();
  const password = str(input.password, "รหัสผ่าน");
  if (!EMAIL_RE.test(email)) throw badRequest("รูปแบบอีเมลไม่ถูกต้อง");
  if (password.length < 8) throw badRequest("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");

  await connectDB();
  if (await User.exists({ email })) throw conflict("อีเมลนี้ถูกใช้งานแล้ว");

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    // roles is forced to customer — admins can never be self-registered
    const user = await User.create({ name, email, passwordHash, phone: optStr(input.phone), roles: ["customer"] });
    return toPublicUser(user.toObject());
  } catch (e) {
    if ((e as { code?: number }).code === 11000) throw conflict("อีเมลนี้ถูกใช้งานแล้ว");
    throw e;
  }
}

export async function loginUser(input: { email?: unknown; password?: unknown }) {
  const email = str(input.email, "อีเมล").toLowerCase();
  const password = str(input.password, "รหัสผ่าน");

  await connectDB();
  const user = await User.findOne({ email }).select("+passwordHash");
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !valid) throw unauthorized("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  if (user.status !== "active") throw unauthorized("บัญชีนี้ถูกระงับการใช้งาน");

  user.lastLoginAt = new Date();
  await user.save();
  return toPublicUser(user.toObject());
}

export async function getUserProfile(userId: string) {
  await connectDB();
  const user = await User.findById(userId).lean();
  if (!user) throw notFound("ไม่พบผู้ใช้");
  return toPublicUser(user);
}