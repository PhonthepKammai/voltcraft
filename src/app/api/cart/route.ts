import { NextRequest } from "next/server";
import { handle, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { clearCart, getCart, removeCartItem, upsertCartItem } from "@/services/cart.service";

export const GET = handle(async (req: NextRequest) => ok(await getCart((await requireUser(req)).id)));

/** Body: { productId, quantity }  — sets the line's quantity (0 removes it). */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  const { productId, quantity } = await readJson(req);
  return ok(await upsertCartItem(user.id, productId, quantity));
});

/** DELETE /api/cart?productId=<id> removes one line; without productId it clears the cart. */
export const DELETE = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  const productId = req.nextUrl.searchParams.get("productId");
  return ok(productId ? await removeCartItem(user.id, productId) : await clearCart(user.id));
});
