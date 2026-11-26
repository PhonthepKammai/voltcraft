export async function api<T = unknown>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const body = await res.json();

  if (!body.success) {
    // message มาจาก backend เป็นภาษาไทยอยู่แล้ว เอาไปโชว์ใน toast ได้เลย
    throw new Error(body.message ?? 'เกิดข้อผิดพลาด');
  }
  return body.data as T;
}