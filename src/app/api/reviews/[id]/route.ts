import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, ok } from '@/lib/errors';
import { moderateReview } from '@/services/review.service';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(req);
    const { id } = await context.params;
    const body = await req.json();
    const review = await moderateReview(id, body);
    return ok(review, 'Review updated');
  } catch (error) {
    return handleApiError(error);
  }
}