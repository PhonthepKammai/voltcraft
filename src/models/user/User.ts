import { Schema } from "mongoose";
import { opts, registerModel } from "../_shared/helpers";

export const ROLES = [
  "customer", 
  "admin"
] as const;

export const AddressSchema = new Schema(
  {
    label: String, // บ้าน / ที่ทำงาน
    recipient: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    subdistrict: { type: String, required: true },
    district: { type: String, required: true },
    province: { type: String, required: true },
    postalCode: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    phone: String,
    roles: {
      type: [{ type: String, enum: ROLES }],
      default: ["customer"],
      validate: [(v: string[]) => v.length > 0, "Must have at least 1 role"],
      index: true,
    },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    addresses: [AddressSchema], // ใช้กับ customer
    lastLoginAt: Date,
  },
  opts
);

export const User = registerModel("User", UserSchema);
