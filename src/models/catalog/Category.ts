import { Schema } from "mongoose";
import { opts, ref, registerModel } from "../_shared/helpers";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true},
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true},
    image: { type: String, trim: true },
    parentId: {
      ...ref("Category"),
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  opts
);

CategorySchema.pre("save", function () {
  if (!this.image && this.name) {
    this.image = `https://placehold.co/500x500?text=${encodeURIComponent(this.name)}`;
  }
});

export const Category = registerModel("Category", CategorySchema);