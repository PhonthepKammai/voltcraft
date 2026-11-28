import type { NextRequest } from "next/server";
import { handle, ok, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { deleteOrDisableBrand, updateBrand } from "@/services/taxonomy.service";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  const body = await readJson(req);
  const brand = await updateBrand(id, body);
  return ok({ brand }, "อัปเดตแบรนด์เรียบร้อยแล้ว");
});

export const DELETE = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  const result = await deleteOrDisableBrand(id);
  return ok(
    result,
    result.disabled
      ? `มีสินค้า ${result.usedCount} รายการใช้อยู่ ระบบปิดใช้งานแบรนด์นี้แทนการลบ`
      : "ลบแบรนด์เรียบร้อยแล้ว"
  );
});