import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, ok } from '@/lib/errors';
import { createCategory, listCategories } from '@/services/taxonomy.service';

export async function GET() {
  try {
    const categories = await listCategories();
    return ok(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const category = await createCategory(body);
    return ok(category, 'Category created', 201);
  } catch (error) {
    return handleApiError(error);
  }
}