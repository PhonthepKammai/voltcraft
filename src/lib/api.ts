import { NextResponse } from "next/server";
import { AppError } from "./errors";

export type ApiBody<T = unknown> = { success: boolean; data?: T; message?: string };

export function ok<T>(data?: T, message?: string, status = 200) {
  return NextResponse.json<ApiBody<T>>({ success: true, data, message }, { status });
}

export const created = <T>(data?: T, message?: string) => ok(data, message, 201);

export function fail(message: string, status = 400) {
  return NextResponse.json<ApiBody>({ success: false, message }, { status });
}

/** Wrap a route handler so AppError -> proper status, anything else -> 500. */
export function handle<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof AppError) return fail(err.message, err.statusCode);
      console.error("[api]", err);
      return fail("เกิดข้อผิดพลาดภายในระบบ", 500);
    }
  };
}

/** Parse JSON body; empty/invalid body becomes {}. */
export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}
