import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { AppError } from '@/lib/errors';
import { Brand, Category, Product } from '@/models';

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface CreateTaxonomyInput {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  logo?: string;
}

export async function listCategories() {
  await connectDB();
  return Category.find().sort({ name: 1 }).lean();
}

export async function createCategory(data: CreateTaxonomyInput) {
  await connectDB();

  const name = data.name?.trim();
  if (!name) {
    throw new AppError('Category name is required', 400);
  }

  const slug = data.slug?.trim() ? toSlug(data.slug) : toSlug(name);
  if (!slug) {
    throw new AppError('A valid category slug could not be generated', 400);
  }

  const exists = await Category.findOne({ slug }).lean();
  if (exists) {
    throw new AppError(`Category with slug "${slug}" already exists`, 409);
  }

  return Category.create({
    name,
    slug,
    description: data.description?.trim(),
    image: data.image?.trim(),
  });
}

export async function deleteCategory(id: string) {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid category ID', 400);
  }

  const referencedCount = await Product.countDocuments({ categoryId: id });
  if (referencedCount > 0) {
    throw new AppError(
      `Cannot delete category: ${referencedCount} product(s) still reference it`,
      400
    );
  }

  const deleted = await Category.findByIdAndDelete(id).lean();
  if (!deleted) {
    throw new AppError('Category not found', 404);
  }

  return deleted;
}

export async function listBrands() {
  await connectDB();
  return Brand.find().sort({ name: 1 }).lean();
}

export async function createBrand(data: CreateTaxonomyInput) {
  await connectDB();

  const name = data.name?.trim();
  if (!name) {
    throw new AppError('Brand name is required', 400);
  }

  const slug = data.slug?.trim() ? toSlug(data.slug) : toSlug(name);
  if (!slug) {
    throw new AppError('A valid brand slug could not be generated', 400);
  }

  const exists = await Brand.findOne({ slug }).lean();
  if (exists) {
    throw new AppError(`Brand with slug "${slug}" already exists`, 409);
  }

  return Brand.create({
    name,
    slug,
    description: data.description?.trim(),
    logo: data.logo?.trim() ?? data.image?.trim(),
  });
}

export async function deleteBrand(id: string) {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid brand ID', 400);
  }

  const referencedCount = await Product.countDocuments({ brandId: id });
  if (referencedCount > 0) {
    throw new AppError(
      `Cannot delete brand: ${referencedCount} product(s) still reference it`,
      400
    );
  }

  const deleted = await Brand.findByIdAndDelete(id).lean();
  if (!deleted) {
    throw new AppError('Brand not found', 404);
  }

  return deleted;
}