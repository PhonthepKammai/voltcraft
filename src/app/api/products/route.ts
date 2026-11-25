import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, ok } from '@/lib/errors';
import { createProduct, listProducts } from '@/services/product.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const products = await listProducts({
      search: searchParams.get('search') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      brand: searchParams.get('brand') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    });
    return ok(products);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const product = await createProduct(body);
    return ok(product, 'Product created', 201);
  } catch (error) {
    return handleApiError(error);
  }
}