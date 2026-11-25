'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Send, Star } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { Review } from '@/types/voltcraft';
import { formatDateTH } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';

function ReviewModerationCard({ review }: { review: Review }) {
  const { adminActions } = useStore();
  const [replyDraft, setReplyDraft] = useState(review.reply?.text ?? '');

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-zinc-900">{review.productName}</h4>
            <Badge variant={review.status === 'published' ? 'emerald' : 'zinc'}>
              {review.status}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
            <span className="font-semibold text-zinc-700">{review.customerName}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              {review.rating}/5
            </span>
            <span>•</span>
            <span>{formatDateTH(review.createdAt)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => adminActions.toggleReviewStatus(review._id)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
        >
          {review.status === 'published' ? (
            <>
              <EyeOff className="h-3.5 w-3.5" />
              <span>Hide</span>
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" />
              <span>Publish</span>
            </>
          )}
        </button>
      </div>

      <p className="mt-3 text-sm text-zinc-700">{review.comment}</p>

      {/* Reply Input */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={replyDraft}
          onChange={(e) => setReplyDraft(e.target.value)}
          placeholder="Write an official VoltCraft store reply..."
          className="h-11 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:outline-none"
        />
        <button
          type="button"
          onClick={() => adminActions.replyToReview(review._id, replyDraft)}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white transition hover:bg-amber-600"
        >
          <Send className="h-4 w-4" />
          <span>{review.reply ? 'Update Reply' : 'Post Reply'}</span>
        </button>
      </div>
    </div>
  );
}

export function AdminReviewsTab() {
  const { reviews } = useStore();

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewModerationCard key={review._id} review={review} />
      ))}
    </div>
  );
}