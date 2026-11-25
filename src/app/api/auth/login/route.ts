import { NextRequest } from 'next/server';
import { setAuthCookie } from '@/lib/auth';
import { handleApiError, ok } from '@/lib/errors';
import { loginUser } from '@/services/auth.service';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const { user, token } = await loginUser(email, password);
    const res = ok({ user }, 'Login successful');
    setAuthCookie(res, token);
    return res;
  } catch (error) {
    return handleApiError(error);
  }
}