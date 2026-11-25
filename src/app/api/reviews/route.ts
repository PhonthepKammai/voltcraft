import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleApiError, ok } from '@/lib/errors';
import { createReview } from '@/services/review.service';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json();
    const review = await createReview(user.userId, body);
    return ok(review, 'Review submitted', 201);
  } catch (error) {
    return handleApiError(error);
  }
}