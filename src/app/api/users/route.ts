import type { NextRequest } from "next/server";
import { handle, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { userService } from "@/services/user.service";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const auth = await requireUser(req);
  await userService.assertAdmin(auth.id);

  const sp = req.nextUrl.searchParams;
  const users = await userService.list({
    search: sp.get("search") ?? undefined,
    role: sp.get("role") ?? undefined,
    status: sp.get("status") ?? undefined,
  });

  return ok({ users });
});

export const PATCH = handle(async (req: NextRequest) => {
  const auth = await requireUser(req);
  await userService.assertAdmin(auth.id);

  const body = (await readJson(req)) as { userId?: unknown; status?: unknown };
  const user = await userService.updateStatus(body?.userId, body?.status, auth.id);

  return ok({ user }, "อัปเดตสถานะผู้ใช้งานเรียบร้อยแล้ว");
});