import { NextRequest } from "next/server";
import { created, handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createReview } from "@/services/review.service";

export const POST = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  return created(await createReview(user.id, await readJson(req)), "ขอบคุณสำหรับรีวิว");
});
