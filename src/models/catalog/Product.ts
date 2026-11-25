// models/catalog/Product.ts
import { Schema } from "mongoose";
import { opts, ref, registerModel } from "../_shared/helpers";

const ProductSchema = new Schema(
  {
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,

    categoryId: { ...ref("Category"), required: true, index: true },
    brandId: { ...ref("Brand"), required: true, index: true },

    price: { type: Number, required: true, min: 0 },

    sale: {
      isActive: { type: Boolean, default: false },
      type: { type: String, enum: ["percent", "fixed"], default: "fixed" },
      value: { type: Number, default: 0, min: 0 },
      startsAt: Date,
      expiresAt: Date,
    },

    images: [String],
    attributes: { type: Map, of: String },

    status: { 
      type: String, 
      enum: ["active", "archived"], 
      default: "active", 
      index: true 
    },

    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    stock: { type: Number, default: 0, min: 0 },
  },
  opts
);

ProductSchema.index({ name: "text", sku: "text" });

export const Product = registerModel("Product", ProductSchema);