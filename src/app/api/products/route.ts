import { NextRequest } from "next/server";
import { created, handle, ok, readJson } from "@/lib/api";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { createProduct, listProducts } from "@/services/product.service";

const numParam = (v: string | null) => (v !== null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : undefined);

export const GET = handle(async (req: NextRequest) => {
  const p = req.nextUrl.searchParams;
  const isAdmin = (await getCurrentUser(req))?.isAdmin ?? false;
  const status = p.get("status");
  const data = await listProducts({
    q: p.get("q") ?? undefined,
    category: p.get("category") ?? undefined,
    brand: p.get("brand") ?? undefined,
    minPrice: numParam(p.get("minPrice")),
    maxPrice: numParam(p.get("maxPrice")),
    inStock: p.get("inStock") === "true",
    sort: p.get("sort") ?? undefined,
    page: numParam(p.get("page")),
    limit: numParam(p.get("limit")),
    // only admins may see archived products
    status: isAdmin && (status === "archived" || status === "all") ? status : "active",
  });
  return ok(data);
});

export const POST = handle(async (req: NextRequest) => {
  await requireAdmin(req);
  return created(await createProduct(await readJson(req)), "เพิ่มสินค้าแล้ว");
});
