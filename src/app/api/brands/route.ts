import { NextRequest } from "next/server";
import { created, handle, ok, readJson } from "@/lib/api";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { createBrand, listBrands } from "@/services/taxonomy.service";

export const GET = handle(async (req: NextRequest) => {
  const isAdmin = (await getCurrentUser(req))?.isAdmin ?? false;
  return ok(await listBrands({ includeInactive: isAdmin }));
});

export const POST = handle(async (req: NextRequest) => {
  await requireAdmin(req);
  return created(await createBrand(await readJson(req)), "เพิ่มข้อมูลแล้ว");
});
