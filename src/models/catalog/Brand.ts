// models/catalog/Brand.ts
import { Schema } from "mongoose";
import { opts, registerModel } from "../_shared/helpers";

const BrandSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo: { type: String, required: true },
    description: String,
    isFeatured: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 }, // เรียงลำดับโลโก้หน้าแรก (เลขน้อยขึ้นก่อน)
    isActive: { type: Boolean, default: true, index: true },
  },
  opts
);

BrandSchema.pre("save", function () {
  if (!this.logo && this.name) {
    this.logo = `https://placehold.co/500x500?text=${encodeURIComponent(this.name)}`;
  }
});

export const Brand = registerModel("Brand", BrandSchema);