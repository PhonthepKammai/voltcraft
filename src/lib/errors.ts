export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const badRequest = (m: string) => new AppError(m, 400);
export const unauthorized = (m = "กรุณาเข้าสู่ระบบ") => new AppError(m, 401);
export const forbidden = (m = "ไม่มีสิทธิ์เข้าถึง") => new AppError(m, 403);
export const notFound = (m = "ไม่พบข้อมูล") => new AppError(m, 404);
export const conflict = (m: string) => new AppError(m, 409);
