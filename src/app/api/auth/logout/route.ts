import { clearAuthCookie } from '@/lib/auth';
import { ok } from '@/lib/errors';

export async function POST() {
  const res = ok(null, 'Logged out successfully');
  clearAuthCookie(res);
  return res;
}