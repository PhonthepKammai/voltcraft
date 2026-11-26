import { handle, ok } from "@/lib/api";
import { clearAuthCookie } from "@/lib/auth";

export const POST = handle(async () => {
  const res = ok(undefined, "ออกจากระบบแล้ว");
  clearAuthCookie(res);
  return res;
});
