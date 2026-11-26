import { NextRequest } from "next/server";
import { handle, ok, readJson } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { deleteProduct, getProductById, updateProduct } from "@/services/product.service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle(async (_req: NextRequest, { params }: Ctx) => {
  return ok(await getProductById((await params).id));
});

export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  await requireAdmin(req);
  return ok(await updateProduct((await params).id, await readJson(req)), "แก้ไขสินค้าแล้ว");
});

export const DELETE = handle(async (req: NextRequest, { params }: Ctx) => {
  await requireAdmin(req);
  const r = await deleteProduct((await params).id);
  return ok(r, r.archived ? "สินค้ามีประวัติการสั่งซื้อ จึงถูกเก็บเข้าคลัง (archived)" : "ลบสินค้าแล้ว");
});
