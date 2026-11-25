import { NextRequest } from 'next/server';
import { setAuthCookie } from '@/lib/auth';
import { handleApiError, ok } from '@/lib/errors';
import { registerCustomer } from '@/services/auth.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user, token } = await registerCustomer(body);
    const res = ok({ user }, 'Registration successful', 201);
    setAuthCookie(res, token);
    return res;
  } catch (error) {
    return handleApiError(error);
  }
}