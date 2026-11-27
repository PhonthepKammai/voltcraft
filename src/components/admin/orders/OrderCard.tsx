'use client';

import React from 'react';
import { CheckCircle2, Loader2, SlidersHorizontal, Truck } from 'lucide-react';
import { Order, OrderStatus } from '@/types/voltcraft';
import { formatDateTH, formatTHB } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import {
  getOrderCustomerName,
  getOrderPaymentBadge,
  STATUS_META,
} from './orderUtils';

interface OrderCardProps {
  order: Order;
  onManage: (order: Order, presetStatus?: OrderStatus) => void;
  onQuickDeliver: (order: Order) => Promise<void>;
  isQuickUpdating: boolean;
}

export function OrderCard({
  order,
  onManage,
  onQuickDeliver,
  isQuickUpdating,
}: OrderCardProps) {
  const customerName = getOrderCustomerName(order);
  const paymentInfo = getOrderPaymentBadge(order.payment);
  const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const previewItems = order.items.slice(0, 2);
  const moreCount = order.items.length - previewItems.length;
  const isTerminal = order.status === 'delivered' || order.status === 'cancelled';

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs transition hover:border-amber-300 hover:shadow-sm">
      <div>
        {/* เลขออเดอร์ + สถานะ */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate font-mono text-sm font-bold text-zinc-900">
              {order.orderNo}
            </h4>
            <p className="mt-0.5 text-[11px] text-zinc-400">
              {formatDateTH(order.createdAt)}
            </p>
          </div>
          <Badge variant={STATUS_META[order.status].badge}>
            {STATUS_META[order.status].label}
          </Badge>
        </div>

        {/* ลูกค้า + ยอดรวม */}
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-zinc-50 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-zinc-900">
              {customerName}
            </p>
            <p className="truncate text-[11px] text-zinc-500">
              {order.shippingAddress?.province || '-'}
              {order.shippingAddress?.phone ? ` • ${order.shippingAddress.phone}` : ''}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-zinc-900">
              {formatTHB(order.total)}
            </p>
            <p className="text-[10px] font-medium text-zinc-500">
              {paymentInfo.text}
            </p>
          </div>
        </div>

        {/* รายการสินค้าย่อ */}
        <div className="mt-3 space-y-1 text-xs">
          {previewItems.map((item, idx) => (
            <div
              key={`${item.productId}-${idx}`}
              className="flex items-center justify-between gap-2 text-zinc-700"
            >
              <span className="truncate">
                {item.name}{' '}
                <span className="font-semibold text-zinc-500">×{item.quantity}</span>
              </span>
              <span className="shrink-0 font-medium text-zinc-900">
                {formatTHB(item.lineTotal)}
              </span>
            </div>
          ))}
          {moreCount > 0 && (
            <p className="text-[11px] font-medium text-amber-600">
              + อีก {moreCount} รายการ (รวม {totalQty} ชิ้น)
            </p>
          )}
        </div>

        {/* เลขพัสดุ */}
        {order.shipment?.trackingNo && (
          <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-800">
            <Truck className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            <span className="truncate">
              {order.shipment.carrier ? `${order.shipment.carrier}: ` : ''}
              {order.shipment.trackingNo}
            </span>
          </div>
        )}
      </div>

      {/* ปุ่มจัดการด่วน */}
      <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-3">
        {(order.status === 'pending' || order.status === 'paid') && (
          <button
            type="button"
            onClick={() => onManage(order, 'shipped')}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 text-xs font-semibold text-white transition hover:bg-amber-600"
          >
            <Truck className="h-3.5 w-3.5" />
            <span>ส่งสินค้า</span>
          </button>
        )}

        {order.status === 'shipped' && (
          <button
            type="button"
            disabled={isQuickUpdating}
            onClick={() => onQuickDeliver(order)}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {isQuickUpdating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            <span>ส่งสำเร็จ</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onManage(order)}
          className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:border-amber-400 hover:bg-amber-50/50 ${
            isTerminal ? 'flex-1' : 'shrink-0'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>{isTerminal ? 'ดูรายละเอียด' : 'จัดการ'}</span>
        </button>
      </div>
    </div>
  );
}