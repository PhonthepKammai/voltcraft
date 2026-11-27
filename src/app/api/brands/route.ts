import type { NextRequest } from "next/server";
import { created, handle, ok, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { createBrand, listBrands } from "@/services/taxonomy.service";

export const dynamic = "force-dynamic";

export const GET = handle(async (req: NextRequest) => {
  const includeInactive = req.nextUrl.searchParams.get("includeInactive") === "true";
  const brands = await listBrands({ includeInactive });
  return ok({ brands });
});

export const POST = handle(async (req: NextRequest) => {
  await requireAdmin(req);
  const body = await readJson(req);
  const brand = await createBrand(body);
  return created({ brand }, "เพิ่มแบรนด์เรียบร้อยแล้ว");
});