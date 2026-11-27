'use client';

import React, { FormEvent, useRef, useState } from 'react';
import { Camera, Loader2, Package, Star, X } from 'lucide-react';
import { OrderItem } from '@/types/voltcraft';
import { api } from '@/lib/apiClient';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useToast } from '@/context/ToastContext';

interface ReviewModalProps {
  orderId: string;
  orderNo: string;
  item: OrderItem;
  onClose: () => void;
  onSubmitted: (orderId: string, productId: string) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'แย่มาก',
  2: 'พอใช้',
  3: 'ดี',
  4: 'ดีมาก',
  5: 'ยอดเยี่ยม',
};

const MAX_REVIEW_IMAGES = 5;
const MAX_COMMENT_LENGTH = 2000;

export function ReviewModal({
  orderId,
  orderNo,
  item,
  onClose,
  onSubmitted,
}: ReviewModalProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { uploadFiles, uploading, progress } = useImageUpload({
    scope: 'reviews',
    maxFiles: MAX_REVIEW_IMAGES,
    onSuccess: (urls) => setImages((prev) => [...prev, ...urls]),
  });

  const activeRating = hoverRating || rating;

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (uploading || submitting) return;

    try {
      setSubmitting(true);
      await api('/api/reviews', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          orderId,
          productId: String(item.productId),
          rating,
          comment: comment.trim() || undefined,
          images,
        }),
      });

      showToast('ขอบคุณสำหรับรีวิวสินค้า', 'success');
      onSubmitted(orderId, String(item.productId));
      onClose();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'ส่งรีวิวไม่สำเร็จ',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900">เขียนรีวิวสินค้า</h3>
            <p className="font-mono text-xs text-zinc-400">คำสั่งซื้อ {orderNo}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto p-5">
          {/* ข้อมูลสินค้าที่กำลังรีวิว */}
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <Package className="h-5 w-5 text-zinc-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900">
                {item.name}
              </p>
              <p className="text-xs text-zinc-500">
                {item.sku ? `${item.sku} • ` : ''}จำนวน {item.quantity} ชิ้น
              </p>
            </div>
          </div>

          {/* เลือกดาว 1-5 */}
          <div className="text-center">
            <label className="mb-2 block text-xs font-semibold text-zinc-700">
              ให้คะแนนความพึงพอใจ
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= activeRating;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    aria-label={`ให้ ${star} ดาว`}
                    className="rounded-lg p-1 transition hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 transition ${
                        filled
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-xs font-semibold text-amber-600">
              {activeRating} / 5 ดาว • {RATING_LABELS[activeRating]}
            </p>
          </div>

          {/* เขียนรีวิว */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-700">
                ความคิดเห็นเพิ่มเติม (ไม่บังคับ)
              </label>
              <span className="text-[11px] text-zinc-400">
                {comment.length}/{MAX_COMMENT_LENGTH}
              </span>
            </div>
            <textarea
              rows={4}
              maxLength={MAX_COMMENT_LENGTH}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="เล่าประสบการณ์การใช้งาน คุณภาพสินค้า หรือการจัดส่ง..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* เพิ่มรูปภาพ (สูงสุด 5 รูป) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-700">
                เพิ่มรูปภาพประกอบ ({images.length}/{MAX_REVIEW_IMAGES})
              </label>
              {uploading && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  กำลังอัปโหลด {progress.done}/{progress.total}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
              {images.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
                >
                  <img
                    src={url}
                    alt={`รูปรีวิว ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    aria-label="ลบรูป"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900/70 text-white hover:bg-rose-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {images.length < MAX_REVIEW_IMAGES && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 text-zinc-500 transition hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                  <span className="text-[10px] font-semibold">เพิ่มรูป</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              disabled={uploading || images.length >= MAX_REVIEW_IMAGES}
              className="hidden"
              onChange={async (e) => {
                if (e.target.files?.length) {
                  await uploadFiles(e.target.files, images.length);
                  e.target.value = '';
                }
              }}
            />
            <p className="text-[11px] text-zinc-400">
              รองรับ JPG, PNG, WebP, AVIF ขนาดไม่เกิน 4 MB ต่อรูป
            </p>
          </div>

          {/* ปุ่มส่งรีวิว */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={uploading || submitting}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-amber-500 px-5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{submitting ? 'กำลังส่งรีวิว...' : 'ส่งรีวิว'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}