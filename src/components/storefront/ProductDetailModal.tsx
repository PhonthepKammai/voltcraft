'use client';

import React, { useState } from 'react';
import { X, Star, ShoppingCart, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Product, Review } from '@/types/voltcraft';
import {
  formatDateTH,
  formatTHB,
  getDiscountPercent,
  getEffectivePrice,
} from '@/lib/format';
import { Badge } from '@/components/ui/Badge';

interface ProductDetailModalProps {
  product: Product | null;
  reviews: Review[];
  onClose: () => void;
  onAddToCart: (product: Product, qty: number) => void;
}

export function ProductDetailModal({
  product,
  reviews,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  if (!product) return null;

  const effectivePrice = getEffectivePrice(product.price, product.salePrice);
  const discount = getDiscountPercent(product.price, product.salePrice);
  const publishedReviews = reviews.filter(
    (r) => r.productId === product._id && r.status === 'published'
  );
  const outOfStock = product.stock <= 0;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-zinc-900/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-zinc-200 bg-white shadow-2xl sm:rounded-3xl">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <Badge variant="amber">{product.brand.name}</Badge>
            <span className="text-xs font-medium text-zinc-400">SKU: {product.sku}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product details"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Image Gallery */}
            <div>
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
                <img
                  src={product.images[activeImageIdx] ?? product.images[0]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              {product.images.length > 1 && (
                <div className="mt-2.5 flex gap-2 overflow-x-auto">
                  {product.images.map((img, idx) => (
                    <button
                      key={img}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${
                        idx === activeImageIdx ? 'border-amber-500' : 'border-zinc-200'
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Summary */}
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                {product.category.name}
              </span>
              <h2 className="mt-1 text-xl font-bold text-zinc-900">{product.name}</h2>

              <div className="mt-2 flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1 font-semibold text-zinc-800">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  {product.ratingAvg.toFixed(1)}
                </span>
                <span className="text-zinc-400">({product.ratingCount} ratings)</span>
                <span
                  className={`font-semibold ${
                    outOfStock ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {outOfStock ? 'Out of Stock' : `${product.stock} in stock`}
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-2.5">
                <span className="text-2xl font-bold text-zinc-900">
                  {formatTHB(effectivePrice)}
                </span>
                {discount && (
                  <>
                    <span className="text-sm text-zinc-400 line-through">
                      {formatTHB(product.price)}
                    </span>
                    <Badge variant="amber">Save {discount}%</Badge>
                  </>
                )}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                {product.description}
              </p>

              <button
                type="button"
                disabled={outOfStock}
                onClick={() => onAddToCart(product, 1)}
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>{outOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>
            </div>
          </div>

          {/* Complete Specifications Table */}
          <div className="mt-8">
            <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-900">
              Technical Specifications
            </h3>
            <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200">
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-zinc-100">
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <tr key={key} className="even:bg-zinc-50/70">
                      <th className="w-2/5 px-4 py-2.5 font-medium text-zinc-600">
                        {key}
                      </th>
                      <td className="px-4 py-2.5 font-semibold text-zinc-900">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer ReviewList */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-zinc-900">
                <MessageSquare className="h-4 w-4 text-amber-600" />
                <span>Customer Reviews ({publishedReviews.length})</span>
              </h3>
            </div>

            {publishedReviews.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
                No customer reviews published for this appliance yet.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {publishedReviews.map((review) => (
                  <div
                    key={review._id}
                    className="rounded-2xl border border-zinc-200 bg-white p-4"
                  >
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

                    <p className="mt-2 text-sm text-zinc-700">{review.comment}</p>

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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}