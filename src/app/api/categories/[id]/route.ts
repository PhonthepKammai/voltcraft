import type { NextRequest } from "next/server";
import { handle, ok, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import {
  deleteOrDisableCategory,
  updateCategory,
} from "@/services/taxonomy.service";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  const body = await readJson(req);
  const category = await updateCategory(id, body);
  return ok({ category }, "อัปเดตหมวดหมู่เรียบร้อยแล้ว");
});

export const DELETE = handle(async (req: NextRequest, ctx: Ctx) => {
  await requireAdmin(req);
  const { id } = await ctx.params;
  const result = await deleteOrDisableCategory(id);
  return ok(
    result,
    result.disabled
      ? `มีสินค้า ${result.usedCount} รายการใช้อยู่ ระบบปิดใช้งานหมวดหมู่นี้แทนการลบ`
      : "ลบหมวดหมู่เรียบร้อยแล้ว"
  );
});