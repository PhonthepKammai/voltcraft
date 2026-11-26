import { NextRequest } from "next/server";
import { handle, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { deleteCategory } from "@/services/taxonomy.service";

export const DELETE = handle(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin(req);
  await deleteCategory((await params).id);
  return ok(undefined, "ลบข้อมูลแล้ว");
});
