import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, ok } from '@/lib/errors';
import { createBrand, listBrands } from '@/services/taxonomy.service';

export async function GET() {
  try {
    const brands = await listBrands();
    return ok(brands);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const brand = await createBrand(body);
    return ok(brand, 'Brand created', 201);
  } catch (error) {
    return handleApiError(error);
  }
}