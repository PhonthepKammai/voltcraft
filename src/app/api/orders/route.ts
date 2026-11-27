import { NextRequest } from "next/server";
import { created, handle, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createCheckout, listOrders } from "@/services/order.service";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  return ok(await listOrders(user, req.nextUrl.searchParams.get("status") ?? undefined));
});

export const POST = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  const body = await readJson<{
    items?: unknown;
    shippingAddress?: unknown;
    paymentMethod?: unknown;
    note?: unknown;
  }>(req);

  const result = await createCheckout(user.id, body);
  return created(result, "สร้างคำสั่งซื้อเรียบร้อยแล้ว");
});