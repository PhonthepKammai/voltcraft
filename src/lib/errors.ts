import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function ok<T>(data?: T, message?: string, status = 200) {
  const body: ApiResponse<T> = { success: true };
  if (data !== undefined) body.data = data;
  if (message) body.message = message;
  return NextResponse.json(body, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(error.errors).map((e) => e.message);
    return NextResponse.json<ApiResponse>(
      { success: false, message: messages.join(', ') },
      { status: 400 }
    );
  }

  if (error instanceof mongoose.Error.CastError) {
    return NextResponse.json<ApiResponse>(
      { success: false, message: `Invalid identifier for field "${error.path}"` },
      { status: 400 }
    );
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  ) {
    const keyValue = (error as { keyValue?: Record<string, unknown> }).keyValue;
    const field = keyValue ? Object.keys(keyValue)[0] : 'field';
    return NextResponse.json<ApiResponse>(
      { success: false, message: `Duplicate value for "${field}"` },
      { status: 409 }
    );
  }

  console.error('[API_ERROR]', error);
  return NextResponse.json<ApiResponse>(
    { success: false, message: 'Internal server error' },
    { status: 500 }
  );
}