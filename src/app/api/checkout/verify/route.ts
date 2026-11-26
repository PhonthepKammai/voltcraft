import { NextRequest } from "next/server";
import { handle, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { confirmStripePayment } from "@/services/order.service";

/** Called by the success page with ?session_id=... so the UI doesn't depend on webhook timing. */
export const POST = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  const { sessionId } = await readJson<{ sessionId?: string }>(req);
  const r = await confirmStripePayment(String(sessionId ?? ""), user);
  return ok(r, r.paid ? "ชำระเงินสำเร็จ" : "ยังไม่ได้รับการชำระเงิน");
});
