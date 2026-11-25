import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { Brand, Category, Product, Review } from '@/models';

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
}

export interface ProductPayload {
  name: string;
  slug?: string;
  sku?: string;
  description?: string;
  categoryId: string;
  brandId: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  images?: string[];
  specs?: Record<string, string>;
  status?: string;
}

async function resolveTaxonomyId(
  model: typeof Category | typeof Brand,
  value: string
): Promise<mongoose.Types.ObjectId | null> {
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  const doc = await model.findOne({ slug: value.toLowerCase() }).select('_id').lean();
  return doc ? (doc._id as mongoose.Types.ObjectId) : null;
}

function validatePricingAndStock(
  price?: number,
  salePrice?: number | null,
  stock?: number
) {
  if (price !== undefined && (typeof price !== 'number' || Number.isNaN(price) || price < 0)) {
    throw new AppError('Price must be a non-negative number in THB', 400);
  }

  if (salePrice !== undefined && salePrice !== null) {
    if (typeof salePrice !== 'number' || Number.isNaN(salePrice) || salePrice < 0) {
      throw new AppError('Sale price must be a non-negative number in THB', 400);
    }
    if (price !== undefined && salePrice > price) {
      throw new AppError('Sale price cannot exceed regular price', 400);
    }
  }

  if (
    stock !== undefined &&
    (typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0)
  ) {
    throw new AppError('Stock must be a non-negative integer', 400);
  }
}

export async function listProducts(filters: ProductFilters = {}) {
  await connectDB();

  const query: Record<string, unknown> = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.search?.trim()) {
    const regex = new RegExp(filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ name: regex }, { description: regex }, { sku: regex }];
  }

  if (filters.category?.trim()) {
    const categoryId = await resolveTaxonomyId(Category, filters.category.trim());
    if (!categoryId) {
      return [];
    }
    query.categoryId = categoryId;
  }

  if (filters.brand?.trim()) {
    const brandId = await resolveTaxonomyId(Brand, filters.brand.trim());
    if (!brandId) {
      return [];
    }
    query.brandId = brandId;
  }

  return Product.find(query)
    .populate('categoryId', 'name slug')
    .populate('brandId', 'name slug logo')
    .sort({ createdAt: -1 })
    .lean();
}

export async function getProductById(idOrSlug: string) {
  await connectDB();

  const filter = mongoose.Types.ObjectId.isValid(idOrSlug)
    ? { _id: idOrSlug }
    : { slug: idOrSlug };

  const product = await Product.findOne(filter)
    .populate('categoryId', 'name slug')
    .populate('brandId', 'name slug logo')
    .lean();

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const reviews = await Review.find({
    productId: product._id,
    status: 'published',
  })
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return { ...product, reviews };
}

export async function createProduct(data: ProductPayload) {
  await connectDB();

  const name = data.name?.trim();
  if (!name) {
    throw new AppError('Product name is required', 400);
  }

  validatePricingAndStock(data.price, data.salePrice, data.stock);

  const [categoryExists, brandExists] = await Promise.all([
    Category.exists({ _id: data.categoryId }),
    Brand.exists({ _id: data.brandId }),
  ]);

  if (!categoryExists) {
    throw new AppError('Referenced category does not exist', 400);
  }
  if (!brandExists) {
    throw new AppError('Referenced brand does not exist', 400);
  }

  const baseSlug = data.slug?.trim() ? toSlug(data.slug) : toSlug(name);
  let slug = baseSlug;
  let suffix = 1;

  while (await Product.exists({ slug })) {
    slug = `${baseSlug}-${suffix++}`;
  }

  const created = await Product.create({
    ...data,
    name,
    slug,
    stock: data.stock ?? 0,
  });

  return Product.findById(created._id)
    .populate('categoryId', 'name slug')
    .populate('brandId', 'name slug logo')
    .lean();
}

export async function updateProduct(id: string, data: Partial<ProductPayload>) {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid product ID', 400);
  }

  const existing = await Product.findById(id);
  if (!existing) {
    throw new AppError('Product not found', 404);
  }

  const nextPrice = data.price !== undefined ? data.price : existing.price;
  const nextSalePrice = data.salePrice !== undefined ? data.salePrice : existing.salePrice;
  validatePricingAndStock(nextPrice, nextSalePrice, data.stock);

  if (data.categoryId) {
    const exists = await Category.exists({ _id: data.categoryId });
    if (!exists) throw new AppError('Referenced category does not exist', 400);
  }

  if (data.brandId) {
    const exists = await Brand.exists({ _id: data.brandId });
    if (!exists) throw new AppError('Referenced brand does not exist', 400);
  }

  const updates: Partial<ProductPayload> = { ...data };

  if (data.slug !== undefined) {
    const normalizedSlug = toSlug(data.slug);
    const conflict = await Product.exists({ slug: normalizedSlug, _id: { $ne: id } });
    if (conflict) {
      throw new AppError(`Slug "${normalizedSlug}" is already in use`, 409);
    }
    updates.slug = normalizedSlug;
  }

  const updated = await Product.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })
    .populate('categoryId', 'name slug')
    .populate('brandId', 'name slug logo')
    .lean();

  return updated;
}

export async function deleteProduct(id: string) {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid product ID', 400);
  }

  const deleted = await Product.findByIdAndDelete(id).lean();
  if (!deleted) {
    throw new AppError('Product not found', 404);
  }

  return deleted;
}