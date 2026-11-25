// lib/api-client.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'include', // ส่งและรับ HTTP-only cookie (voltcraft_token) อัตโนมัติ
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const json = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !json.success) {
    throw new Error(json.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
  }

  return json.data as T;
}