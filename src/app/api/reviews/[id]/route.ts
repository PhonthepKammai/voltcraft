import { NextRequest } from "next/server";
import { handle, ok, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { assertId } from "@/lib/validate";
import { connectDB } from "@/lib/db";
import { Review } from "@/models";
import { moderateReview } from "@/services/review.service";

/**
 * GET /api/reviews/:productId
 * ดึงรีวิวที่ published ของสินค้า (public)
 * - [id] ตีความเป็น productId (ไม่ใช่ review id)
 * - query: ?limit=20&page=1
 */
export const GET = handle(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const productId = assertId((await params).id, "productId");

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);
  const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
  const skip = (page - 1) * limit;

  await connectDB();

  const filter = { productId, status: "published" as const };
  const [items, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("customerId", "name")
      .lean(),
    Review.countDocuments(filter),
  ]);

  return ok({
    items: items.map((r: any) => ({
      _id: String(r._id),
      productId: String(r.productId),
      productName: "",
      customerName: r.customerId?.name ?? "ผู้ใช้",
      rating: r.rating,
      comment: r.comment ?? "",
      images: (r.images ?? []).map((i: any) => i.url),
      status: r.status,
      reply: r.reply?.text
        ? { text: r.reply.text, at: r.reply.at }
        : undefined,
      createdAt: r.createdAt,
    })),
    total,
    page,
    limit,
  });
});

/**
 * PATCH /api/reviews/:reviewId
 * admin moderate รีวิว (เดิม)
 * - [id] ตีความเป็น reviewId
 */
export const PATCH = handle(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const admin = await requireAdmin(req);
  return ok(await moderateReview((await params).id, admin.id, await readJson(req)));
});