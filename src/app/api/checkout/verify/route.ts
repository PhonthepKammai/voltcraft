import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleApiError, ok } from '@/lib/errors';
import { confirmStripePayment } from '@/services/order.service';

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    const { sessionId } = await req.json();
    const result = await confirmStripePayment(sessionId);
    return ok(result, 'Payment verified');
  } catch (error) {
    return handleApiError(error);
  }
}