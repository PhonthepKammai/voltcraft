import { NextRequest } from "next/server";
import { created, handle, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Review } from "@/models";
import { createReview } from "@/services/review.service";

export const GET = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  await connectDB();
  const mine = await Review.find({ customerId: user.id })
    .select("orderId productId rating")
    .lean();
  return ok(mine);
});

export const POST = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  return created(await createReview(user.id, await readJson(req)), "ขอบคุณสำหรับรีวิว");
});