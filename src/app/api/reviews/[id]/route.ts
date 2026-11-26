import { NextRequest } from "next/server";
import { handle, ok, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { moderateReview } from "@/services/review.service";

/** Body: { reply?: string ('' clears), hidden?: boolean } */
export const PATCH = handle(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const admin = await requireAdmin(req);
  return ok(await moderateReview((await params).id, admin.id, await readJson(req)));
});
