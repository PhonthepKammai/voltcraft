// models/catalog/Brand.ts
import { Schema } from "mongoose";
import { opts, registerModel } from "../_shared/helpers";

const BrandSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true }, // เช่น "VoltCool", "Samsung", "LG"
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true }, // เช่น "voltcool"
    logo: { type: String, required: true }, // URL รูปโลโก้แบรนด์
    description: String,
    isFeatured: { type: Boolean, default: true, index: true }, // แสดงบนแถบโลโก้หน้าแรกหรือไม่
    sortOrder: { type: Number, default: 0 }, // เรียงลำดับโลโก้หน้าแรก (เลขน้อยขึ้นก่อน)
    isActive: { type: Boolean, default: true, index: true },
  },
  opts
);

export const Brand = registerModel("Brand", BrandSchema);