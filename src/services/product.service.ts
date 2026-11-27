import type { QueryFilter } from "mongoose";
import { connectDB } from "@/lib/db";
import { badRequest, conflict, notFound } from "@/lib/errors";
import { assertId, escapeRegex, num, optStr, slugify, str } from "@/lib/validate";
import { Brand, Cart, Category, Order, Product } from "@/models";
import { ensureDefaultBrand, ensureDefaultCategory } from "./taxonomy.service";

// ---------- pricing ----------
type SaleLike = { isActive?: boolean | null; type?: string | null; value?: number | null; startsAt?: Date | null; expiresAt?: Date | null };

/** Effective unit price in THB: sale price when a sale is active and in-window, else base price. */
export function getEffectivePrice(p: { price: number; sale?: SaleLike | null }, now = new Date()): number {
  const s = p.sale;
  if (!s?.isActive || !s.value) return p.price;
  if (s.startsAt && s.startsAt > now) return p.price;
  if (s.expiresAt && s.expiresAt < now) return p.price;
  const raw = s.type === "percent" ? p.price * (1 - Math.min(s.value, 100) / 100) : p.price - s.value;
  return Math.max(0, Math.round(raw * 100) / 100);
}

type PopulatedRef = { _id: unknown; name: string; slug: string; logo?: string };

const extractRef = (ref: unknown) => {
  if (ref && typeof ref === "object" && "_id" in ref) {
    const r = ref as PopulatedRef;
    return {
      id: String(r._id),
      obj: { ...r, _id: String(r._id) },
    };
  }
  return {
    id: ref ? String(ref) : undefined,
    obj: undefined,
  };
};

const withPrice = <
  T extends {
    _id?: unknown;
    price: number;
    sale?: SaleLike | null;
    categoryId?: unknown;
    brandId?: unknown;
  }
>(
  p: T
) => {
  const effective = getEffectivePrice(p);
  const cat = extractRef(p.categoryId);
  const brd = extractRef(p.brandId);

  return {
    ...p,
    ...(p._id !== undefined && { _id: String(p._id) }),
    categoryId: cat.id,
    brandId: brd.id,
    category: cat.obj,
    brand: brd.obj,
    salePrice: effective < p.price ? effective : null,
    effectivePrice: effective,
  };
};

const POPULATE = [
  { path: "categoryId", select: "name slug" },
  { path: "brandId", select: "name slug logo" },
];

// ---------- queries ----------
export interface ProductFilters {
  q?: string; category?: string; brand?: string; minPrice?: number; maxPrice?: number;
  inStock?: boolean; status?: "active" | "archived" | "all"; sort?: string; page?: number; limit?: number;
}

async function resolveRef(model: typeof Category | typeof Brand, v: string) {
  if (/^[a-f\d]{24}$/i.test(v)) return v;
  const doc = await (model as typeof Category).findOne({ slug: v.toLowerCase() }).select("_id").lean();
  return doc ? String(doc._id) : null;
}

export async function listProducts(f: ProductFilters = {}) {
  await connectDB();
  const filter: QueryFilter<Record<string, unknown>> = {};
  if (f.status !== "all") filter.status = f.status ?? "active";

  if (f.q) {
    const rx = new RegExp(escapeRegex(f.q.trim()), "i"); // regex (not $text) so Thai search works
    filter.$or = [{ name: rx }, { sku: rx }];
  }
  if (f.category) {
    const id = await resolveRef(Category, f.category);
    if (!id) return { items: [], total: 0, page: 1, limit: f.limit ?? 20 };
    filter.categoryId = id;
  }
  if (f.brand) {
    const id = await resolveRef(Brand, f.brand);
    if (!id) return { items: [], total: 0, page: 1, limit: f.limit ?? 20 };
    filter.brandId = id;
  }
  if (f.minPrice !== undefined || f.maxPrice !== undefined) {
    filter.price = {
      ...(f.minPrice !== undefined && { $gte: f.minPrice }),
      ...(f.maxPrice !== undefined && { $lte: f.maxPrice }),
    };
  }
  if (f.inStock) filter.stock = { $gt: 0 };

  const sorts: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 }, price_asc: { price: 1 }, price_desc: { price: -1 },
    rating: { ratingAvg: -1, ratingCount: -1 }, name: { name: 1 },
  };
  const limit = Math.min(Math.max(f.limit ?? 20, 1), 100);
  const page = Math.max(f.page ?? 1, 1);

  const [items, total] = await Promise.all([
    Product.find(filter).populate(POPULATE).sort(sorts[f.sort ?? "newest"] ?? sorts.newest)
      .skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  return { items: items.map(withPrice), total, page, limit };
}

export async function getProductById(id: string) {
  assertId(id);
  await connectDB();
  const p = await Product.findById(id).populate(POPULATE).lean();
  if (!p) throw notFound("ไม่พบสินค้า");
  return withPrice(p);
}

// ---------- mutations ----------
type ProductInput = Record<string, unknown>;

function parseSale(v: unknown) {
  if (v === undefined) return undefined;
  if (v === null) return { isActive: false, value: 0 };
  const s = v as Record<string, unknown>;
  const type: "percent" | "fixed" = s.type === "percent" ? "percent" : "fixed";
  const value = num(s.value ?? 0, "ส่วนลด", { min: 0 });
  if (type === "percent" && value > 100) throw badRequest("ส่วนลดเปอร์เซ็นต์ต้องไม่เกิน 100");
  return {
    isActive: Boolean(s.isActive), type, value,
    startsAt: s.startsAt ? new Date(String(s.startsAt)) : undefined,
    expiresAt: s.expiresAt ? new Date(String(s.expiresAt)) : undefined,
  };
}

async function assertRefs(categoryId?: string, brandId?: string) {
  if (categoryId && !(await Category.exists({ _id: categoryId }))) throw notFound("ไม่พบหมวดหมู่");
  if (brandId && !(await Brand.exists({ _id: brandId }))) throw notFound("ไม่พบแบรนด์");
}

const dup = (e: unknown): never => {
  if ((e as { code?: number }).code === 11000) throw conflict("sku หรือ slug ซ้ำกับสินค้าที่มีอยู่");
  throw e;
};

export async function createProduct(input: ProductInput) {
  const name = str(input.name, "ชื่อสินค้า", { max: 200 });
  const data = {
    sku: str(input.sku, "SKU"),
    name,
    slug: optStr(input.slug)?.toLowerCase() ?? slugify(name),
    description: optStr(input.description),
    categoryId: assertId(input.categoryId, "categoryId"),
    brandId: assertId(input.brandId, "brandId"),
    price: num(input.price, "ราคา", { min: 0 }),
    stock: input.stock === undefined ? 0 : num(input.stock, "สต็อก", { min: 0, int: true }),
    images: Array.isArray(input.images) ? input.images.filter((x): x is string => typeof x === "string") : [],
    attributes: input.attributes && typeof input.attributes === "object" ? input.attributes : undefined,
    sale: parseSale(input.sale),
    status: (input.status === "archived" ? "archived" : "active") as "active" | "archived",
  };
  if (!data.slug) throw badRequest("ไม่สามารถสร้าง slug ได้ กรุณาระบุ slug");

  await connectDB();
  const categoryId = input.categoryId
  ? assertId(input.categoryId, "categoryId")
  : (await ensureDefaultCategory())._id;
const brandId = input.brandId
  ? assertId(input.brandId, "brandId")
  : (await ensureDefaultBrand())._id;

  await assertRefs(data.categoryId, data.brandId);
  try {
    const created = await Product.create(data);
    await created.populate(POPULATE);
    return withPrice(created.toObject());
  } catch (e) {
    return dup(e);
  }
}

export async function updateProduct(id: string, input: ProductInput) {
  assertId(id);
  const patch: Record<string, unknown> = {};
  if (input.sku !== undefined) patch.sku = str(input.sku, "SKU");
  if (input.name !== undefined) patch.name = str(input.name, "ชื่อสินค้า", { max: 200 });
  if (input.slug !== undefined) patch.slug = str(input.slug, "slug").toLowerCase();
  if (input.description !== undefined) patch.description = String(input.description);
  if (input.categoryId !== undefined) patch.categoryId = assertId(input.categoryId, "categoryId");
  if (input.brandId !== undefined) patch.brandId = assertId(input.brandId, "brandId");
  if (input.price !== undefined) patch.price = num(input.price, "ราคา", { min: 0 });
  if (input.stock !== undefined) patch.stock = num(input.stock, "สต็อก", { min: 0, int: true });
  if (Array.isArray(input.images)) patch.images = input.images.filter((x) => typeof x === "string");
  if (input.attributes && typeof input.attributes === "object") patch.attributes = input.attributes;
  if (input.sale !== undefined) patch.sale = parseSale(input.sale);
  if (input.status === "active" || input.status === "archived") patch.status = input.status;
  if (!Object.keys(patch).length) throw badRequest("ไม่มีข้อมูลสำหรับแก้ไข");

  await connectDB();
  if (input.categoryId !== undefined) {
    patch.categoryId = input.categoryId
      ? assertId(input.categoryId, "categoryId")
      : (await ensureDefaultCategory())._id;
  }
  if (input.brandId !== undefined) {
    patch.brandId = input.brandId
      ? assertId(input.brandId, "brandId")
      : (await ensureDefaultBrand())._id;
  }
  await assertRefs(patch.categoryId as string | undefined, patch.brandId as string | undefined);
  try {
    const p = await Product.findByIdAndUpdate(
      id,
      { $set: patch },
      { returnDocument: "after", runValidators: true }
    ).populate(POPULATE).lean();
    if (!p) throw notFound("ไม่พบสินค้า");
    return withPrice(p);
  } catch (e) {
    return dup(e);
  }
}

/** Soft-delete if the product appears in any order (history must stay intact); hard-delete otherwise. */
export async function deleteProduct(id: string) {
  assertId(id);
  await connectDB();
  if (await Order.exists({ "items.productId": id })) {
    const p = await Product.findByIdAndUpdate(id, { status: "archived" });
    if (!p) throw notFound("ไม่พบสินค้า");
    await Cart.updateMany({}, { $pull: { items: { productId: id } } });
    return { archived: true };
  }
  const p = await Product.findByIdAndDelete(id);
  if (!p) throw notFound("ไม่พบสินค้า");
  await Cart.updateMany({}, { $pull: { items: { productId: id } } });
  return { archived: false };
}
