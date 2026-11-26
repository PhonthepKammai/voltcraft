import { NextRequest } from "next/server";
import { handle, ok, readJson } from "@/lib/api";
import { setAuthCookie, signToken } from "@/lib/auth";
import { loginUser } from "@/services/auth.service";

export const POST = handle(async (req: NextRequest) => {
  const user = await loginUser(await readJson(req));
  const res = ok({ user }, "เข้าสู่ระบบสำเร็จ");
  setAuthCookie(res, await signToken(user.id));
  return res;
});
