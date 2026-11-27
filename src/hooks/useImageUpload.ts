'use client';

import { useCallback, useState } from 'react';
import { useToast } from '@/context/ToastContext';

export type UploadScope = 'products' | 'reviews' | 'categories' | 'brands';

export interface UploadedImage {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

interface UploadApiResponse {
  success: boolean;
  data?: {
    files: UploadedImage[];
    urls: string[];
  };
  message?: string;
}

interface UseImageUploadOptions {
  scope: UploadScope;
  maxFiles?: number;
  maxSizeMB?: number;
  onSuccess?: (urls: string[], files: UploadedImage[]) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const UPLOAD_ENDPOINT = '/api/upload';

export function useImageUpload({
  scope,
  maxFiles = scope === 'products' ? 10 : 5,
  maxSizeMB = 4,
  onSuccess,
}: UseImageUploadOptions) {
  const { showToast } = useToast();

  const [uploading, setUploading] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const uploadSingleFile = async (file: File): Promise<UploadedImage> => {
    const formData = new FormData();
    formData.append('scope', scope);
    formData.append('files', file);

    // ไม่ใส่ Content-Type เพื่อให้ browser สร้าง multipart boundary เอง
    const res = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const body = (await res.json()) as UploadApiResponse;
    if (!res.ok || !body.success || !body.data?.files?.[0]) {
      throw new Error(body.message ?? `อัปโหลดไฟล์ "${file.name}" ไม่สำเร็จ`);
    }
    return body.data.files[0];
  };

  const uploadFiles = useCallback(
    async (input: FileList | File[], existingCount = 0): Promise<string[]> => {
      const files = Array.from(input);
      if (files.length === 0) return [];

      // 1. เช็กจำนวนรวม
      const remaining = maxFiles - existingCount;
      if (remaining <= 0) {
        showToast(`อัปโหลดได้สูงสุด ${maxFiles} รูป`, 'error');
        return [];
      }
      if (files.length > remaining) {
        showToast(`เลือกเพิ่มได้อีกไม่เกิน ${remaining} รูป`, 'error');
        return [];
      }

      // 2. เช็กชนิดไฟล์และขนาดฝั่ง client ก่อนส่ง
      const maxBytes = maxSizeMB * 1024 * 1024;
      for (const file of files) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          showToast(`"${file.name}" ไม่รองรับ (ใช้ได้เฉพาะ JPG, PNG, WebP, AVIF)`, 'error');
          return [];
        }
        if (file.size > maxBytes) {
          showToast(`"${file.name}" ใหญ่เกิน ${maxSizeMB} MB`, 'error');
          return [];
        }
      }

      try {
        setUploading(true);
        setProgress({ done: 0, total: files.length });

        // 3. อัปโหลดหลายไฟล์พร้อมกัน (แยก request ต่อไฟล์เพื่อกันติดลิมิต 4.5 MB ของ Vercel)
        const results = await Promise.allSettled(
          files.map(async (file) => {
            const uploaded = await uploadSingleFile(file);
            setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
            return uploaded;
          })
        );

        const succeeded: UploadedImage[] = [];
        const failedMessages: string[] = [];

        for (const r of results) {
          if (r.status === 'fulfilled') succeeded.push(r.value);
          else failedMessages.push(r.reason instanceof Error ? r.reason.message : 'อัปโหลดไม่สำเร็จ');
        }

        const urls = succeeded.map((item) => item.url);

        if (urls.length > 0) {
          onSuccess?.(urls, succeeded);
          showToast(`อัปโหลดรูปสำเร็จ ${urls.length} รูป`, 'success');
        }
        if (failedMessages.length > 0) {
          showToast(failedMessages[0], 'error');
        }

        return urls;
      } finally {
        setUploading(false);
        setProgress({ done: 0, total: 0 });
      }
    },
    [maxFiles, maxSizeMB, onSuccess, scope, showToast]
  );

  const deleteImage = useCallback(
    async (url: string): Promise<boolean> => {
      try {
        setDeletingUrl(url);
        const res = await fetch(UPLOAD_ENDPOINT, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const body = (await res.json()) as { success: boolean; message?: string };
        if (!res.ok || !body.success) {
          throw new Error(body.message ?? 'ลบรูปภาพไม่สำเร็จ');
        }
        showToast('ลบรูปภาพเรียบร้อยแล้ว', 'success');
        return true;
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'ลบรูปภาพไม่สำเร็จ', 'error');
        return false;
      } finally {
        setDeletingUrl(null);
      }
    },
    [showToast]
  );

  return {
    uploadFiles,
    deleteImage,
    uploading,
    deletingUrl,
    progress,
  };
}