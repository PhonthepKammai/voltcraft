import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleApiError, ok } from '@/lib/errors';
import { createStripeCheckout } from '@/services/order.service';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { shippingAddress, note } = await req.json();
    const result = await createStripeCheckout(user.userId, shippingAddress, note);
    return ok(result, 'Checkout session created', 201);
  } catch (error) {
    return handleApiError(error);
  }
}