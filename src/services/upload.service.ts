import { del, put } from "@vercel/blob";
import { AppError, badRequest } from "@/lib/errors";

export const UPLOAD_SCOPES = {
  products: {
    folder: "voltcraft/products",
    requireAdmin: true,
    maxFiles: 10,
    maxSizeBytes: 4 * 1024 * 1024, // 4 MB (ปลอดภัยจากลิมิต 4.5 MB ของ Vercel)
  },
  reviews: {
    folder: "voltcraft/reviews",
    requireAdmin: false,
    maxFiles: 5,
    maxSizeBytes: 4 * 1024 * 1024,
  },
  categories: {
    folder: "voltcraft/categories",
    requireAdmin: true,
    maxFiles: 1,
    maxSizeBytes: 2 * 1024 * 1024,
  },
  brands: {
    folder: "voltcraft/brands",
    requireAdmin: true,
    maxFiles: 1,
    maxSizeBytes: 2 * 1024 * 1024,
  },
} as const;

export type UploadScope = keyof typeof UPLOAD_SCOPES;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export interface UploadedImage {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

export function isUploadScope(value: unknown): value is UploadScope {
  return typeof value === "string" && value in UPLOAD_SCOPES;
}

function assertBlobToken() {

  const hasToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const hasOidc = Boolean(process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN);

  if (!hasToken && !hasOidc) {
    throw new AppError("ยังไม่ได้ตั้งค่า BLOB_READ_WRITE_TOKEN", 500);
  }
}

function sanitizeFileName(name: string): string {
  const clean = name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return clean || "image.webp";
}

function validateFile(file: File, maxSizeBytes: number) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw badRequest(`ไฟล์ "${file.name}" ไม่รองรับ (รองรับเฉพาะ JPG, PNG, WebP, AVIF)`);
  }
  if (file.size <= 0) {
    throw badRequest(`ไฟล์ "${file.name}" ไม่มีข้อมูล`);
  }
  if (file.size > maxSizeBytes) {
    const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    throw badRequest(`ไฟล์ "${file.name}" มีขนาดเกิน ${maxMb} MB`);
  }
}

export const uploadService = {
  async uploadImages(
    files: File[],
    scope: UploadScope,
    userId: string
  ): Promise<UploadedImage[]> {
    assertBlobToken();

    const config = UPLOAD_SCOPES[scope];
    if (files.length === 0) {
      throw badRequest("กรุณาเลือกไฟล์รูปภาพอย่างน้อย 1 รูป");
    }
    if (files.length > config.maxFiles) {
      throw badRequest(`อัปโหลดได้สูงสุดครั้งละ ${config.maxFiles} รูป`);
    }

    // ตรวจความถูกต้องทุกไฟล์ก่อนเริ่มอัปโหลดจริง
    for (const file of files) {
      validateFile(file, config.maxSizeBytes);
    }

    const uploaded = await Promise.all(
      files.map(async (file) => {
        const safeName = sanitizeFileName(file.name);
        const pathname = `${config.folder}/${userId}/${Date.now()}-${safeName}`;

        const blob = await put(pathname, file, {
          access: "public",
          addRandomSuffix: true,
          contentType: file.type,
        });

        return {
          url: blob.url,
          pathname: blob.pathname,
          contentType: file.type,
          size: file.size,
        };
      })
    );

    return uploaded;
  },

  async deleteImage(url: unknown): Promise<void> {
    assertBlobToken();

    if (typeof url !== "string" || !url.trim()) {
      throw badRequest("กรุณาระบุ URL รูปภาพที่ต้องการลบ");
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw badRequest("รูปแบบ URL ไม่ถูกต้อง");
    }

    if (!parsed.hostname.endsWith(".public.blob.vercel-storage.com")) {
      throw badRequest("อนุญาตให้ลบเฉพาะไฟล์ที่อยู่บน Vercel Blob เท่านั้น");
    }

    await del(url);
  },
};