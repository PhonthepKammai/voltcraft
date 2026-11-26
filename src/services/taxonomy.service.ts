import { connectDB } from "@/lib/db";
import { badRequest, conflict, notFound } from "@/lib/errors";
import { assertId, optStr, slugify, str } from "@/lib/validate";
import { Brand, Category, Product } from "@/models";

function dupGuard(e: unknown, msg: string): never {
  if ((e as { code?: number }).code === 11000) throw conflict(msg);
  throw e;
}

// ---------- Categories ----------
export async function listCategories(opts: { includeInactive?: boolean } = {}) {
  await connectDB();
  return Category.find(opts.includeInactive ? {} : { isActive: true }).sort({ name: 1 }).lean();
}

export async function createCategory(input: { name?: unknown; slug?: unknown; parentId?: unknown }) {
  const name = str(input.name, "ชื่อหมวดหมู่", { max: 100 });
  const slug = optStr(input.slug)?.toLowerCase() ?? slugify(name);
  if (!slug) throw badRequest("ไม่สามารถสร้าง slug ได้ กรุณาระบุ slug");

  await connectDB();
  const parentId = input.parentId ? assertId(input.parentId, "parentId") : undefined;
  if (parentId && !(await Category.exists({ _id: parentId }))) throw notFound("ไม่พบหมวดหมู่แม่");
  try {
    return (await Category.create({ name, slug, parentId })).toObject();
  } catch (e) {
    dupGuard(e, "slug นี้ถูกใช้แล้ว");
  }
}

export async function deleteCategory(id: string) {
  assertId(id);
  await connectDB();
  if (await Product.exists({ categoryId: id })) throw conflict("ยังมีสินค้าในหมวดหมู่นี้ ลบไม่ได้");
  if (await Category.exists({ parentId: id })) throw conflict("ยังมีหมวดหมู่ย่อย ลบไม่ได้");
  const res = await Category.findByIdAndDelete(id);
  if (!res) throw notFound("ไม่พบหมวดหมู่");
}

// ---------- Brands ----------
export async function listBrands(opts: { includeInactive?: boolean } = {}) {
  await connectDB();
  return Brand.find(opts.includeInactive ? {} : { isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
}

export async function createBrand(input: {
  name?: unknown; slug?: unknown; logo?: unknown; description?: unknown; isFeatured?: unknown; sortOrder?: unknown;
}) {
  const name = str(input.name, "ชื่อแบรนด์", { max: 100 });
  const slug = optStr(input.slug)?.toLowerCase() ?? slugify(name);
  if (!slug) throw badRequest("ไม่สามารถสร้าง slug ได้ กรุณาระบุ slug");
  const logo = str(input.logo, "URL โลโก้");

  await connectDB();
  try {
    return (
      await Brand.create({
        name, slug, logo,
        description: optStr(input.description),
        isFeatured: typeof input.isFeatured === "boolean" ? input.isFeatured : undefined,
        sortOrder: typeof input.sortOrder === "number" ? input.sortOrder : undefined,
      })
    ).toObject();
  } catch (e) {
    dupGuard(e, "ชื่อหรือ slug แบรนด์นี้ถูกใช้แล้ว");
  }
}

export async function deleteBrand(id: string) {
  assertId(id);
  await connectDB();
  if (await Product.exists({ brandId: id })) throw conflict("ยังมีสินค้าของแบรนด์นี้ ลบไม่ได้");
  const res = await Brand.findByIdAndDelete(id);
  if (!res) throw notFound("ไม่พบแบรนด์");
}
