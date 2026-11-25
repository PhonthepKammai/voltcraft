import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleApiError, ok } from '@/lib/errors';
import { getUserProfile } from '@/services/auth.service';

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const profile = await getUserProfile(authUser.userId);
    return ok(profile);
  } catch (error) {
    return handleApiError(error);
  }
}