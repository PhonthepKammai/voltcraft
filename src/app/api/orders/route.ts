import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleApiError, ok } from '@/lib/errors';
import { listOrders } from '@/services/order.service';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? undefined;
    const orders = await listOrders(user, status);
    return ok(orders);
  } catch (error) {
    return handleApiError(error);
  }
}