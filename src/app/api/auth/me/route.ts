import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getUserProfile } from "@/services/auth.service";

export const GET = handle(async (req: NextRequest) => {
  const me = await requireUser(req);
  return ok({ user: await getUserProfile(me.id) });
});
