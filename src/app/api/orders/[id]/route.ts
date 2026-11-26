import { NextRequest } from "next/server";
import { handle, ok, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { updateOrderAdmin } from "@/services/order.service";

/** Body: { status?: 'paid'|'shipped'|'delivered'|'cancelled', shipment?: { carrier?, trackingNo? } } */
export const PATCH = handle(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin(req);
  return ok(await updateOrderAdmin((await params).id, await readJson(req)), "อัปเดตออเดอร์แล้ว");
});
