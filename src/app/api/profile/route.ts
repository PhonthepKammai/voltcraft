import type { NextRequest } from "next/server";
import { handle, ok, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { profileService } from "@/services/profile.service";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const auth = await requireUser(req);
  const user = await profileService.getById(auth.id);
  return ok({ user });
});

export const PATCH = handle(async (req: NextRequest) => {
  const auth = await requireUser(req);
  const body = await readJson(req);
  const user = await profileService.update(auth.id, body);
  return ok({ user }, "บันทึกข้อมูลเรียบร้อยแล้ว");
});