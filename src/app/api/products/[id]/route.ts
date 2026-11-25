import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, ok } from '@/lib/errors';
import {
  deleteProduct,
  getProductById,
  updateProduct,
} from '@/services/product.service';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const product = await getProductById(id);
    return ok(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(req);
    const { id } = await context.params;
    const body = await req.json();
    const updated = await updateProduct(id, body);
    return ok(updated, 'Product updated');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(req);
    const { id } = await context.params;
    const deleted = await deleteProduct(id);
    return ok(deleted, 'Product deleted');
  } catch (error) {
    return handleApiError(error);
  }
}