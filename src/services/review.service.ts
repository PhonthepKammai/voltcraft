import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { badRequest, conflict, forbidden, notFound } from "@/lib/errors";
import { assertId, num, optStr } from "@/lib/validate";
import { Order, Product, Review } from "@/models";

/** Recompute ratingAvg / ratingCount from published reviews only. */
export async function recalcProductRating(productId: string) {
  const [agg] = await Review.aggregate([
    { $match: { productId: new Types.ObjectId(productId), status: "published" } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Product.updateOne(
    { _id: productId },
    { ratingAvg: agg ? Math.round(agg.avg * 10) / 10 : 0, ratingCount: agg?.count ?? 0 }
  );
}

export async function createReview(
  userId: string,
  input: { orderId?: unknown; productId?: unknown; rating?: unknown; comment?: unknown; images?: unknown }
) {
  const orderId = assertId(input.orderId, "orderId");
  const productId = assertId(input.productId, "productId");
  const rating = num(input.rating, "คะแนน", { int: true, min: 1 });
  if (rating > 5) throw badRequest("คะแนนต้องอยู่ระหว่าง 1-5");
  const comment = optStr(input.comment);
  if (comment && comment.length > 2000) throw badRequest("ความเห็นยาวเกิน 2000 ตัวอักษร");
  const images = (Array.isArray(input.images) ? input.images : [])
    .filter((u): u is string => typeof u === "string" && !!u.trim())
    .map((url) => ({ url }));
  if (images.length > 5) throw badRequest("แนบรูปได้ไม่เกิน 5 รูป");

  await connectDB();
  const order = await Order.findById(orderId).lean();
  if (!order || String(order.customerId) !== userId) throw notFound("ไม่พบออเดอร์");
  if (order.status !== "delivered") throw forbidden("รีวิวได้เฉพาะออเดอร์ที่จัดส่งสำเร็จแล้ว");
  if (!order.items.some((i) => String(i.productId) === productId)) throw badRequest("สินค้านี้ไม่ได้อยู่ในออเดอร์");

  try {
    const review = await Review.create({ productId, customerId: userId, orderId, rating, comment, images, status: "published" });
    await recalcProductRating(productId);
    return review.toObject();
  } catch (e) {
    if ((e as { code?: number }).code === 11000) throw conflict("คุณรีวิวสินค้านี้ในออเดอร์นี้แล้ว");
    throw e;
  }
}

/** Admin: reply (empty string clears it) and/or hide/unhide. */
export async function moderateReview(
  reviewId: string,
  adminId: string,
  input: { reply?: unknown; hidden?: unknown }
) {
  assertId(reviewId, "reviewId");
  const set: Record<string, unknown> = {};
  const unset: Record<string, 1> = {};

  if (input.reply !== undefined) {
    if (typeof input.reply !== "string") throw badRequest("reply ต้องเป็นข้อความ");
    const text = input.reply.trim();
    if (text.length > 2000) throw badRequest("คำตอบยาวเกิน 2000 ตัวอักษร");
    if (text) set.reply = { text, by: adminId, at: new Date() };
    else unset.reply = 1;
  }
  if (input.hidden !== undefined) {
    if (typeof input.hidden !== "boolean") throw badRequest("hidden ต้องเป็น true/false");
    set.status = input.hidden ? "hidden" : "published";
  }
  if (!Object.keys(set).length && !Object.keys(unset).length) throw badRequest("ไม่มีข้อมูลสำหรับแก้ไข");

  await connectDB();
  const review = await Review.findByIdAndUpdate(
    reviewId,
    { ...(Object.keys(set).length && { $set: set }), ...(Object.keys(unset).length && { $unset: unset }) },
    { new: true }
  ).lean();
  if (!review) throw notFound("ไม่พบรีวิว");

  if (set.status) await recalcProductRating(String(review.productId));
  return review;
}
