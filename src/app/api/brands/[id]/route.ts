import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, ok } from '@/lib/errors';
import { deleteBrand } from '@/services/taxonomy.service';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(req);
    const { id } = await context.params;
    const deleted = await deleteBrand(id);
    return ok(deleted, 'Brand deleted');
  } catch (error) {
    return handleApiError(error);
  }
}