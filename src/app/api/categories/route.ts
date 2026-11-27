import type { NextRequest } from "next/server";
import { created, handle, ok, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { createCategory, listCategories } from "@/services/taxonomy.service";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const includeInactive = req.nextUrl.searchParams.get("includeInactive") === "true";
  const categories = await listCategories({ includeInactive });
  return ok({ categories });
});

export const POST = handle(async (req: NextRequest) => {
  await requireAdmin(req);
  const body = await readJson(req);
  const category = await createCategory(body);
  return created({ category }, "เพิ่มหมวดหมู่เรียบร้อยแล้ว");
});