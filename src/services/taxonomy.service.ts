import { connectDB } from "@/lib/db";
import { badRequest, conflict, notFound } from "@/lib/errors";
import { assertId, optStr, slugify, str } from "@/lib/validate";
import { Brand, Category, Product } from "@/models";

export const DEFAULT_CATEGORY_SLUG = "uncategorized";
export const DEFAULT_BRAND_SLUG = "unbranded";

// SVG inline สำหรับโลโก้ของ "ยังไม่ระบุแบรนด์" (ผ่านเงื่อนไข logo: required ใน BrandSchema)
const DEFAULT_BRAND_LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="12" fill="#F4F4F5"/>
      <path d="M22 32h20M32 22v20" stroke="#A1A1AA" stroke-width="3" stroke-linecap="round"/>
    </svg>`
  );

const serialize = <T extends { _id: unknown }>(doc: T) => ({
  ...doc,
  _id: String(doc._id),
});

const dup = (msg: string) => (e: unknown): never => {
  if ((e as { code?: number }).code === 11000) throw conflict(msg);
  throw e;
};

// ==========================================
// System Fallback (สร้างอัตโนมัติถ้ายังไม่มี)
// ==========================================

export async function ensureDefaultCategory() {
  await connectDB();
  const doc = await Category.findOneAndUpdate(
    { slug: DEFAULT_CATEGORY_SLUG },
    {
      $setOnInsert: {
        name: "ยังไม่มีหมวดหมู่",
        slug: DEFAULT_CATEGORY_SLUG,
        image: "",
        isActive: true,
      },
    },
    { upsert: true, returnDocument: "after" }
  ).lean();

  return serialize(doc as { _id: unknown; name: string; slug: string; image?: string; isActive?: boolean });
}

export async function ensureDefaultBrand() {
  await connectDB();
  const doc = await Brand.findOneAndUpdate(
    { slug: DEFAULT_BRAND_SLUG },
    {
      $setOnInsert: {
        name: "ยังไม่ระบุแบรนด์",
        slug: DEFAULT_BRAND_SLUG,
        logo: DEFAULT_BRAND_LOGO,
        description: "แบรนด์เริ่มต้นสำหรับสินค้าที่ยังไม่ระบุยี่ห้อ",
        isFeatured: false,
        sortOrder: 0,
        isActive: true,
      },
    },
    { upsert: true, returnDocument: "after" }
  ).lean();

  return serialize(doc as { _id: unknown; name: string; slug: string; logo: string; isActive?: boolean });
}

// ==========================================
// Categories
// ==========================================

export async function listCategories(opts: { includeInactive?: boolean } = {}) {
  await ensureDefaultCategory();
  const filter = opts.includeInactive ? {} : { isActive: true };
  const docs = await Category.find(filter).sort({ isActive: -1, createdAt: -1 }).lean();
  return docs.map((d) => serialize(d as { _id: unknown }));
}

export async function createCategory(input: { name?: unknown; slug?: unknown; image?: unknown }) {
  const name = str(input.name, "ชื่อหมวดหมู่", { max: 100 });
  const slug = (optStr(input.slug) ?? slugify(name)).toLowerCase();
  if (!slug) throw badRequest("ไม่สามารถสร้าง slug ได้ กรุณาระบุชื่อหรือ slug");

  await connectDB();
  try {
    const doc = await Category.create({
      name,
      slug,
      image: optStr(input.image) ?? "",
      isActive: true,
    });
    return serialize(doc.toObject());
  } catch (e) {
    return dup("ชื่อหรือ slug ของหมวดหมู่นี้มีอยู่แล้ว")(e);
  }
}

export async function setCategoryActive(id: string, isActive: boolean) {
  assertId(id);
  await connectDB();

  const existing = await Category.findById(id).lean();
  if (!existing) throw notFound("ไม่พบหมวดหมู่");
  if (existing.slug === DEFAULT_CATEGORY_SLUG && !isActive) {
    throw badRequest("ไม่สามารถปิดใช้งานหมวดหมู่เริ่มต้นของระบบได้");
  }

  const updated = await Category.findByIdAndUpdate(
    id,
    { $set: { isActive } },
    { returnDocument: "after", runValidators: true }
  ).lean();

  return serialize(updated as { _id: unknown });
}

/** ถ้ามีสินค้าใช้หมวดหมู่นี้อยู่ -> ปิดใช้งาน (disabled), ถ้าไม่มี -> ลบจริง */
export async function deleteOrDisableCategory(id: string) {
  assertId(id);
  await connectDB();

  const existing = await Category.findById(id).lean();
  if (!existing) throw notFound("ไม่พบหมวดหมู่");
  if (existing.slug === DEFAULT_CATEGORY_SLUG) {
    throw badRequest("ไม่สามารถลบหมวดหมู่เริ่มต้นของระบบได้");
  }

  const usedCount = await Product.countDocuments({ categoryId: id });
  if (usedCount > 0) {
    const disabled = await Category.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { returnDocument: "after" }
    ).lean();
    return {
      deleted: false,
      disabled: true,
      usedCount,
      category: serialize(disabled as { _id: unknown }),
    };
  }

  await Category.findByIdAndDelete(id);
  return { deleted: true, disabled: false, usedCount: 0 };
}

// ==========================================
// Brands
// ==========================================

export async function listBrands(opts: { includeInactive?: boolean } = {}) {
  await ensureDefaultBrand();
  const filter = opts.includeInactive ? {} : { isActive: true };
  const docs = await Brand.find(filter)
    .sort({ isActive: -1, sortOrder: 1, createdAt: -1 })
    .lean();
  return docs.map((d) => serialize(d as { _id: unknown }));
}

export async function createBrand(input: {
  name?: unknown;
  slug?: unknown;
  logo?: unknown;
  description?: unknown;
}) {
  const name = str(input.name, "ชื่อแบรนด์", { max: 100 });
  const logo = str(input.logo, "โลโก้แบรนด์", { max: 2048 });
  const slug = (optStr(input.slug) ?? slugify(name)).toLowerCase();
  if (!slug) throw badRequest("ไม่สามารถสร้าง slug ได้ กรุณาระบุชื่อหรือ slug");

  await connectDB();
  try {
    const doc = await Brand.create({
      name,
      slug,
      logo,
      description: optStr(input.description),
      isActive: true,
    });
    return serialize(doc.toObject());
  } catch (e) {
    return dup("ชื่อหรือ slug ของแบรนด์นี้มีอยู่แล้ว")(e);
  }
}

export async function setBrandActive(id: string, isActive: boolean) {
  assertId(id);
  await connectDB();

  const existing = await Brand.findById(id).lean();
  if (!existing) throw notFound("ไม่พบแบรนด์");
  if (existing.slug === DEFAULT_BRAND_SLUG && !isActive) {
    throw badRequest("ไม่สามารถปิดใช้งานแบรนด์เริ่มต้นของระบบได้");
  }

  const updated = await Brand.findByIdAndUpdate(
    id,
    { $set: { isActive } },
    { returnDocument: "after", runValidators: true }
  ).lean();

  return serialize(updated as { _id: unknown });
}

/** ถ้ามีสินค้าใช้แบรนด์นี้อยู่ -> ปิดใช้งาน (disabled), ถ้าไม่มี -> ลบจริง */
export async function deleteOrDisableBrand(id: string) {
  assertId(id);
  await connectDB();

  const existing = await Brand.findById(id).lean();
  if (!existing) throw notFound("ไม่พบแบรนด์");
  if (existing.slug === DEFAULT_BRAND_SLUG) {
    throw badRequest("ไม่สามารถลบแบรนด์เริ่มต้นของระบบได้");
  }

  const usedCount = await Product.countDocuments({ brandId: id });
  if (usedCount > 0) {
    const disabled = await Brand.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { returnDocument: "after" }
    ).lean();
    return {
      deleted: false,
      disabled: true,
      usedCount,
      brand: serialize(disabled as { _id: unknown }),
    };
  }

  await Brand.findByIdAndDelete(id);
  return { deleted: true, disabled: false, usedCount: 0 };
}