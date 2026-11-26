import { NextRequest } from "next/server";
import { created, handle, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createCheckout } from "@/services/order.service";

export const POST = handle(async (req: NextRequest) => {
  const user = await requireUser(req);
  return created(await createCheckout(user.id, await readJson(req)), "สร้างออเดอร์แล้ว");
});
