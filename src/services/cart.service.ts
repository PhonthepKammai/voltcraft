import { connectDB } from "@/lib/db";
import { badRequest, conflict, notFound } from "@/lib/errors";
import { assertId, num } from "@/lib/validate";
import { Cart, Product } from "@/models";
import { getEffectivePrice } from "./product.service";

/** Cart with live product data + prices. Items whose product vanished/archived are dropped from the view. */
export async function getCart(userId: string) {
  await connectDB();
  const cart = await Cart.findOne({ customerId: userId })
    .populate({ path: "items.productId", select: "sku name slug images price sale stock status" })
    .lean();

  const items = (cart?.items ?? []).flatMap((it) => {
    const p = it.productId as unknown as
      | { _id: unknown; sku: string; name: string; slug: string; images: string[]; price: number; sale?: never; stock: number; status: string }
      | null;
    if (!p || p.status !== "active") return [];
    const unitPrice = getEffectivePrice(p);
    return [{
      productId: String(p._id),
      product: { id: String(p._id), sku: p.sku, name: p.name, slug: p.slug, image: p.images?.[0], price: p.price, stock: p.stock },
      quantity: it.quantity,
      unitPrice,
      lineTotal: Math.round(unitPrice * it.quantity * 100) / 100,
      stockWarning: it.quantity > p.stock,
    }];
  });

  return {
    items,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: Math.round(items.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100,
  };
}

/** Sets the quantity of a line (absolute, not additive). quantity <= 0 removes the line. */
export async function upsertCartItem(userId: string, productIdRaw: unknown, quantityRaw: unknown) {
  const productId = assertId(productIdRaw, "productId");
  const quantity = num(quantityRaw, "จำนวน", { int: true });
  if (quantity <= 0) return removeCartItem(userId, productId);
  if (quantity > 99) throw badRequest("สั่งได้สูงสุด 99 ชิ้นต่อรายการ");

  await connectDB();
  const product = await Product.findById(productId).select("status stock name").lean();
  if (!product || product.status !== "active") throw notFound("ไม่พบสินค้า");
  if (product.stock < quantity) throw conflict(`สินค้า "${product.name}" เหลือในสต็อก ${product.stock} ชิ้น`);

  // update the existing line, or push a new one — two steps so we never create duplicate lines
  const updated = await Cart.updateOne(
    { customerId: userId, "items.productId": productId },
    { $set: { "items.$.quantity": quantity } }
  );
  if (updated.matchedCount === 0) {
    await Cart.updateOne(
      { customerId: userId },
      { $push: { items: { productId, quantity } }, $setOnInsert: { customerId: userId } },
      { upsert: true }
    );
  }
  return getCart(userId);
}

export async function removeCartItem(userId: string, productIdRaw: unknown) {
  const productId = assertId(productIdRaw, "productId");
  await connectDB();
  await Cart.updateOne({ customerId: userId }, { $pull: { items: { productId } } });
  return getCart(userId);
}

export async function clearCart(userId: string) {
  await connectDB();
  await Cart.updateOne({ customerId: userId }, { $set: { items: [] } });
  return getCart(userId);
}
