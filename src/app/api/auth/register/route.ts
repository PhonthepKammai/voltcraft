import { NextRequest } from "next/server";
import { created, handle, readJson } from "@/lib/api";
import { setAuthCookie, signToken } from "@/lib/auth";
import { registerCustomer } from "@/services/auth.service";

export const POST = handle(async (req: NextRequest) => {
  const user = await registerCustomer(await readJson(req));
  const res = created({ user }, "สมัครสมาชิกสำเร็จ");
  setAuthCookie(res, await signToken(user.id));
  return res;
});
