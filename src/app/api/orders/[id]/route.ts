import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, ok } from '@/lib/errors';
import { updateOrderAdmin } from '@/services/order.service';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(req);
    const { id } = await context.params;
    const body = await req.json();
    const updated = await updateOrderAdmin(id, body);
    return ok(updated, 'Order updated');
  } catch (error) {
    return handleApiError(error);
  }
}