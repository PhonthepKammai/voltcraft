import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { listOrders } from "@/services/order.service";

export const GET = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  return ok(await listOrders(user, req.nextUrl.searchParams.get("status") ?? undefined));
});
