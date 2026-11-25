import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, ok } from '@/lib/errors';
import { deleteCategory } from '@/services/taxonomy.service';

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(req);
    const { id } = await context.params;
    const deleted = await deleteCategory(id);
    return ok(deleted, 'Category deleted');
  } catch (error) {
    return handleApiError(error);
  }
}