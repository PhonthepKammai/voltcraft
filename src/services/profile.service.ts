import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { badRequest, notFound } from "@/lib/errors";
import { User } from "@/models";

const MAX_ADDRESSES = 10;

interface AddressInput {
  _id?: string;
  label: string;
  recipient: string;
  phone: string;
  line1: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

// ---------- helpers ----------

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function str(v: unknown, field: string, opts: { required?: boolean; max?: number } = {}): string {
  const { required = false, max = 255 } = opts;
  if (v === undefined || v === null || v === "") {
    if (required) throw badRequest(`กรุณากรอก${field}`);
    return "";
  }
  if (typeof v !== "string") throw badRequest(`${field}ต้องเป็นข้อความ`);
  const s = v.trim();
  if (required && !s) throw badRequest(`กรุณากรอก${field}`);
  if (s.length > max) throw badRequest(`${field}ยาวเกินกำหนด`);
  return s;
}

function checkPhone(phone: string, field: string) {
  if (!/^0\d{8,9}$/.test(phone.replace(/\D/g, ""))) {
    throw badRequest(`${field}ไม่ถูกต้อง`);
  }
}

function parseAddress(raw: unknown, index: number): AddressInput {
  if (!isObject(raw)) throw badRequest(`ที่อยู่ลำดับที่ ${index + 1} ไม่ถูกต้อง`);

  const phone = str(raw.phone, "เบอร์โทรศัพท์ผู้รับ", { required: true, max: 20 });
  checkPhone(phone, "เบอร์โทรศัพท์ผู้รับ");

  const postalCode = str(raw.postalCode, "รหัสไปรษณีย์", { required: true, max: 5 });
  if (!/^\d{5}$/.test(postalCode)) throw badRequest("รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก");

  const address: AddressInput = {
    label: str(raw.label, "ป้ายกำกับที่อยู่", { max: 50 }),
    recipient: str(raw.recipient, "ชื่อผู้รับ", { required: true, max: 100 }),
    phone,
    line1: str(raw.line1, "ที่อยู่", { required: true }),
    subdistrict: str(raw.subdistrict, "แขวง/ตำบล", { max: 100 }),
    district: str(raw.district, "เขต/อำเภอ", { max: 100 }),
    province: str(raw.province, "จังหวัด", { required: true, max: 100 }),
    postalCode,
    isDefault: raw.isDefault === true,
  };

  // เก็บ _id เดิมไว้ (เฉพาะรูปแบบ ObjectId ที่ถูกต้อง)
  if (typeof raw._id === "string" && /^[a-f\d]{24}$/i.test(raw._id)) {
    address._id = raw._id;
  }
  return address;
}

/** บังคับให้มี default แค่ 1 ที่อยู่เสมอ (ถ้ามีที่อยู่) */
function normalizeAddresses(list: AddressInput[]): AddressInput[] {
  if (list.length === 0) return [];
  let defaultIdx = list.findIndex((a) => a.isDefault);
  if (defaultIdx < 0) defaultIdx = 0;
  return list.map((a, i) => ({ ...a, isDefault: i === defaultIdx }));
}

/** whitelist field ที่ส่งกลับ client (ไม่มี passwordHash) */
function toPublicUser(doc: { toObject(): any }) {
  const u = doc.toObject();
  return {
    _id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone ?? "",
    roles: u.roles,
    status: u.status,
    addresses: u.addresses ?? [],
  };
}

// ---------- public API ----------

export const profileService = {
  async getById(userId: string) {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) throw notFound("ไม่พบผู้ใช้งาน");
    return toPublicUser(user);
  },

  async update(userId: string, body: unknown) {
    if (!isObject(body)) throw badRequest("รูปแบบข้อมูลไม่ถูกต้อง");

    await connectDB();
    const user = await User.findById(userId).select("+passwordHash");
    if (!user) throw notFound("ไม่พบผู้ใช้งาน");

    let changed = false;

    // ชื่อ
    if (body.name !== undefined) {
      user.name = str(body.name, "ชื่อ-นามสกุล", { required: true, max: 100 });
      changed = true;
    }

    // เบอร์โทร (ส่งค่าว่าง = ลบเบอร์)
    if (body.phone !== undefined) {
      const phone = str(body.phone, "เบอร์โทรศัพท์", { max: 20 });
      if (phone) checkPhone(phone, "เบอร์โทรศัพท์");
      user.phone = phone;
      changed = true;
    }

    // เปลี่ยนรหัสผ่าน
    if (typeof body.newPassword === "string" && body.newPassword !== "") {
      const currentPassword = str(body.currentPassword, "รหัสผ่านปัจจุบัน", {
        required: true,
        max: 128,
      });
      const newPassword = str(body.newPassword, "รหัสผ่านใหม่", { required: true, max: 128 });

      if (newPassword.length < 8) throw badRequest("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
      if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
        throw badRequest("รหัสผ่านปัจจุบันไม่ถูกต้อง");
      }
      if (currentPassword === newPassword) {
        throw badRequest("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม");
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
      changed = true;
    }

    // ที่อยู่ (client ส่งทั้งรายการมา แทนที่ทั้งก้อน)
    if (body.addresses !== undefined) {
      if (!Array.isArray(body.addresses)) throw badRequest("รูปแบบที่อยู่ไม่ถูกต้อง");
      if (body.addresses.length > MAX_ADDRESSES) {
        throw badRequest(`บันทึกที่อยู่ได้สูงสุด ${MAX_ADDRESSES} รายการ`);
      }
      user.set("addresses", normalizeAddresses(body.addresses.map(parseAddress)));
      changed = true;
    }

    if (!changed) throw badRequest("ไม่มีข้อมูลที่ต้องการแก้ไข");

    await user.save();
    return toPublicUser(user);
  },
};