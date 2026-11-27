import { connectDB } from "@/lib/db";
import { badRequest, notFound, unauthorized } from "@/lib/errors";
import { User } from "@/models";

export const USER_STATUSES = ["active", "suspended"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

type RawUserDoc = {
  _id: unknown;
  name: string;
  email: string;
  phone?: string | null;
  roles?: string[];
  status?: string | null;
  addresses?: unknown[];
  lastLoginAt?: Date | string | null;
  createdAt?: Date | string | null;
};

export interface ListUsersParams {
  search?: string;
  role?: string;
  status?: string;
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function toAdminUser(u: RawUserDoc) {
  const roles = u.roles ?? ["customer"];
  return {
    id: String(u._id),
    _id: String(u._id),
    name: u.name,
    email: u.email,
    phone: u.phone ?? "",
    role: roles.includes("admin") ? "admin" : "customer",
    roles,
    status: (u.status === "suspended" ? "suspended" : "active") as UserStatus,
    addresses: u.addresses ?? [],
    addressCount: Array.isArray(u.addresses) ? u.addresses.length : 0,
    lastLoginAt: u.lastLoginAt ?? null,
    createdAt: u.createdAt ?? null,
  };
}

export const userService = {
  /** ตรวจสิทธิ์ว่าเป็น admin ที่ยัง active อยู่จริงใน DB */
  async assertAdmin(userId: string) {
    await connectDB();
    const actor = await User.findById(userId).select("roles status").lean();
    if (!actor || actor.status !== "active" || !actor.roles?.includes("admin")) {
      throw unauthorized("ต้องใช้สิทธิ์ผู้ดูแลระบบ");
    }
  },

  /** ดึงรายการผู้ใช้สำหรับตาราง Admin */
  async list(params: ListUsersParams = {}) {
    await connectDB();

    const filter: Record<string, unknown> = {};

    const search = params.search?.trim();
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }

    if (params.role === "admin" || params.role === "customer") {
      filter.roles = params.role;
    }

    if (params.status === "active" || params.status === "suspended") {
      filter.status = params.status;
    }

    const docs = await User.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return docs.map((doc) => toAdminUser(doc as RawUserDoc));
  },

  /** อัปเดตสถานะผู้ใช้ (active / suspended) */
  async updateStatus(targetUserId: unknown, status: unknown, actorId: string) {
    if (typeof targetUserId !== "string" || !OBJECT_ID_RE.test(targetUserId)) {
      throw badRequest("รหัสผู้ใช้งานไม่ถูกต้อง");
    }
    if (status !== "active" && status !== "suspended") {
      throw badRequest("สถานะต้องเป็น active หรือ suspended เท่านั้น");
    }
    if (targetUserId === actorId && status === "suspended") {
      throw badRequest("ไม่สามารถระงับบัญชีของตัวเองได้");
    }

    await connectDB();
    const user = await User.findById(targetUserId);
    if (!user) throw notFound("ไม่พบผู้ใช้งาน");

    user.status = status;
    await user.save();

    return toAdminUser(user.toObject() as RawUserDoc);
  },
};