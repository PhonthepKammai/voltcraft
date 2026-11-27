'use client';

import React from 'react';
import { CheckCircle2, MapPin, Package, Star, Truck } from 'lucide-react';
import { Order, OrderItem, OrderStatus } from '@/types/voltcraft';
import { formatDateTH, formatTHB } from '@/lib/format';
import { Badge, BadgeVariant } from '@/components/ui/Badge';

interface CustomerOrderCardProps {
  order: Order;
  reviewedKeys: Set<string>;
  onOpenReview: (order: Order, item: OrderItem) => void;
}

const STATUS_META: Record<OrderStatus, { label: string; badge: BadgeVariant }> = {
  pending: { label: 'รอจัดส่ง', badge: 'amber' },
  paid: { label: 'ชำระแล้ว', badge: 'emerald' },
  shipped: { label: 'กำลังจัดส่ง', badge: 'amber' },
  delivered: { label: 'จัดส่งสำเร็จ', badge: 'emerald' },
  cancelled: { label: 'ยกเลิก', badge: 'rose' },
};

export function CustomerOrderCard({
  order,
  reviewedKeys,
  onOpenReview,
}: CustomerOrderCardProps) {
  const canReview = order.status === 'delivered';
  const addr = order.shippingAddress;
  const fullAddress = [
    addr?.line1,
    addr?.subdistrict,
    addr?.district,
    addr?.province,
    addr?.postalCode,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 bg-zinc-50/70 px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-bold text-zinc-900">
            {order.orderNo}
          </span>
          <Badge variant={STATUS_META[order.status].badge}>
            {STATUS_META[order.status].label}
          </Badge>
          <span className="text-xs text-zinc-400">
            • {formatDateTH(order.createdAt)}
          </span>
        </div>

        <div className="text-right">
          <span className="text-xs text-zinc-500">ยอดรวมสุทธิ </span>
          <span className="text-sm font-bold text-zinc-900">
            {formatTHB(order.total)}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-zinc-100 px-5">
        {order.items.map((item, idx) => {
          const reviewKey = `${order._id}:${String(item.productId)}`;
          const isReviewed = reviewedKeys.has(reviewKey);

          return (
            <div
              key={`${item.productId}-${idx}`}
              className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
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
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {formatTHB(item.unitPrice)} × {item.quantity} ชิ้น
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="text-sm font-bold text-zinc-900">
                  {formatTHB(item.lineTotal)}
                </span>

                {canReview && (
                  isReviewed ? (
                    <span className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      รีวิวแล้ว
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenReview(order, item)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-xs font-semibold text-white transition hover:bg-amber-600"
                    >
                      <Star className="h-3.5 w-3.5" />
                      เขียนรีวิว
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: ที่อยู่จัดส่ง & เลขพัสดุ */}
      <div className="flex flex-col gap-2 border-t border-zinc-100 bg-zinc-50/40 px-5 py-3 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-1.5">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
          <span>
            <strong className="font-semibold text-zinc-800">{addr?.recipient}</strong>{' '}
            ({addr?.phone}) • {fullAddress}
          </span>
        </div>

        {order.shipment?.trackingNo && (
          <div className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-amber-50 px-2.5 py-1 font-medium text-amber-800 sm:self-auto">
            <Truck className="h-3.5 w-3.5 text-amber-600" />
            <span>
              {order.shipment.carrier ? `${order.shipment.carrier}: ` : ''}
              {order.shipment.trackingNo}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}