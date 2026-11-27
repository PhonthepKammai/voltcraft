'use client';

import React, { useEffect, useState } from 'react';
import { Star, MessageSquare, CheckCircle2, ImageOff } from 'lucide-react';
import { Review } from '@/types/voltcraft';
import { formatDateTH } from '@/lib/format';
import { api } from '@/lib/apiClient';

interface ProductReviewsProps {
  productId: string;
  /** จำนวนรีวิวต่อหน้า (default 20) */
  limit?: number;
}

export function ProductReviews({ productId, limit = 20 }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // โหลดหน้าแรกเมื่อเปลี่ยนสินค้า
  useEffect(() => {
    let cancelled = false;
    setReviews([]);
    setTotal(0);
    setPage(1);
    setError(null);
    setLoading(true);

    api<{ items: Review[]; total: number }>(
      `/api/reviews/${productId}?limit=${limit}&page=1`
    )
      .then((res) => {
        if (cancelled) return;
        setReviews(res.items ?? []);
        setTotal(res.total ?? res.items?.length ?? 0);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, limit]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await api<{ items: Review[]; total: number }>(
        `/api/reviews/${productId}?limit=${limit}&page=${nextPage}`
      );
      setReviews((prev) => [...prev, ...(res.items ?? [])]);
      setTotal(res.total ?? total);
      setPage(nextPage);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingMore(false);
    }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-zinc-900">
          <MessageSquare className="h-4 w-4 text-amber-600" />
          <span>Customer Reviews ({total})</span>
        </h3>
        {reviews.length > 0 && (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-800">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            {avgRating}
          </span>
        )}
      </div>

      {/* States */}
      {loading ? (
        <p className="mt-3 text-sm text-zinc-500">กำลังโหลดรีวิว…</p>
      ) : error ? (
        <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          โหลดรีวิวไม่สำเร็จ: {error}
        </p>
      ) : reviews.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
          No customer reviews published for this appliance yet.
        </p>
      ) : (
        <>
          <div className="mt-3 space-y-3">
            {reviews.map((review) => (
              <ReviewCard key={review._id} review={review} onOpenImage={setLightbox} />
            ))}
          </div>

          {reviews.length < total && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="mt-4 w-full rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              {loadingMore ? 'กำลังโหลด…' : `โหลดรีวิวเพิ่ม (${total - reviews.length})`}
            </button>
          )}
        </>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt=""
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-zinc-900"
          >
            ปิด
          </button>
        </div>
      )}
    </section>
  );
}

/* ---------- ReviewCard ---------- */

function ReviewCard({
  review,
  onOpenImage,
}: {
  review: Review;
  onOpenImage: (src: string) => void;
}) {
  const images = review.images ?? [];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-900">
            {review.customerName}
          </span>
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            {review.rating}/5
          </span>
        </div>
        <span className="text-xs text-zinc-400">
          {formatDateTH(review.createdAt)}
        </span>
      </div>

      {review.comment && (
        <p className="mt-2 text-sm text-zinc-700">{review.comment}</p>
      )}

      {/* Review images */}
      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((src, idx) => (
            <button
              key={`${review._id}-img-${idx}`}
              type="button"
              onClick={() => onOpenImage(src)}
              className="group relative h-20 w-20 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
              aria-label={`ดูรูปที่ ${idx + 1}`}
            >
              <img
                src={src}
                alt={`review-${idx + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition group-hover:scale-105"
                onError={(e) => {
                  // ถ้ารูปโหลดไม่ได้ แสดง placeholder
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </button>
          ))}
        </div>
      )}

      {review.reply && (
        <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>VoltCraft Official Reply</span>
            <span className="font-normal text-amber-600">
              • {formatDateTH(review.reply.at)}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-zinc-700">
            {review.reply.text}
          </p>
        </div>
      )}
    </div>
  );
}