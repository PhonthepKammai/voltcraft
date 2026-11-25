import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleApiError, ok } from '@/lib/errors';
import {
  clearCart,
  getCart,
  removeCartItem,
  upsertCartItem,
} from '@/services/cart.service';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const cart = await getCart(user.userId);
    return ok(cart);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { productId, quantity } = await req.json();
    const cart = await upsertCartItem(user.userId, productId, quantity);
    return ok(cart, 'Cart updated');
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    let productId = searchParams.get('productId');

    if (!productId) {
      try {
        const body = await req.json();
        productId = body?.productId ?? null;
      } catch {
        // Empty body clears the entire cart
      }
    }

    const cart = productId
      ? await removeCartItem(user.userId, productId)
      : await clearCart(user.userId);

    return ok(cart, productId ? 'Item removed from cart' : 'Cart cleared');
  } catch (error) {
    return handleApiError(error);
  }
}