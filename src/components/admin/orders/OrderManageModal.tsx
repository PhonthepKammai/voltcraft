'use client';

import React, { useState } from 'react';
import { Check, Copy, Loader2, MapPin, Package, Phone, X } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { Order, OrderStatus } from '@/types/voltcraft';
import { formatDateTH, formatTHB } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import {
  ALLOWED_NEXT_STATUS,
  CARRIER_PRESETS,
  getOrderCustomerEmail,
  getOrderCustomerName,
  getOrderFullAddress,
  getOrderPaymentBadge,
  STATUS_META,
} from './orderUtils';

interface OrderManageModalProps {
  order: Order;
  initialStatus?: OrderStatus;
  onClose: () => void;
}

export function OrderManageModal({
  order,
  initialStatus,
  onClose,
}: OrderManageModalProps) {
  const { adminActions } = useStore();
  const [status, setStatus] = useState<OrderStatus>(initialStatus ?? order.status);
  const [carrier, setCarrier] = useState(order.shipment?.carrier ?? '');
  const [trackingNo, setTrackingNo] = useState(order.shipment?.trackingNo ?? '');
  const [saving, setSaving] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);

  const nextStatuses = ALLOWED_NEXT_STATUS[order.status] ?? [];
  const statusOptions: OrderStatus[] = [order.status, ...nextStatuses];
  const isTerminal = nextStatuses.length === 0;

  const hasChanges =
    status !== order.status ||
    carrier.trim() !== (order.shipment?.carrier ?? '').trim() ||
    trackingNo.trim() !== (order.shipment?.trackingNo ?? '').trim();

  const customerName = getOrderCustomerName(order);
  const customerEmail = getOrderCustomerEmail(order);
  const fullAddress = getOrderFullAddress(order.shippingAddress);
  const paymentInfo = getOrderPaymentBadge(order.payment);

  const handleCopyAddress = async () => {
    const text = [
      customerName,
      order.shippingAddress?.phone ? `โทร: ${order.shippingAddress.phone}` : '',
      fullAddress,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleSave = async () => {
    if (!hasChanges || saving) return;
    try {
      setSaving(true);
      const result: unknown = await adminActions.updateOrderShipment(order._id, {
        status,
        carrier: carrier.trim(),
        trackingNo: trackingNo.trim(),
      });
      if (result !== false) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-mono text-base font-bold text-zinc-900">
                {order.orderNo}
              </h3>
              <Badge variant={STATUS_META[order.status].badge}>
                {STATUS_META[order.status].label}
              </Badge>
              <Badge variant={paymentInfo.variant}>{paymentInfo.text}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">
              สั่งซื้อเมื่อ {formatDateTH(order.createdAt)}
              {customerEmail ? ` • ${customerEmail}` : ''}
            </p>
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

        {/* Body */}
        <div className="space-y-4 overflow-y-auto p-5">
          {/* ที่อยู่จัดส่ง */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-700">
                ที่อยู่จัดส่ง
              </span>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600 hover:border-amber-400 hover:text-amber-700"
              >
                {copiedAddr ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-700">คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>คัดลอกที่อยู่</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-sm font-semibold text-zinc-900">{customerName}</p>
            {order.shippingAddress?.phone && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-600">
                <Phone className="h-3.5 w-3.5 text-zinc-400" />
                {order.shippingAddress.phone}
              </p>
            )}
            <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-zinc-600">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <span>{fullAddress}</span>
            </p>
            {order.note && (
              <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
                หมายเหตุลูกค้า: {order.note}
              </p>
            )}
          </div>

          {/* รายการสินค้าและสรุปยอด */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-3.5">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-700">
                รายการสินค้า ({order.items.length})
              </span>
              <span className="text-sm font-bold text-zinc-900">
                {formatTHB(order.total)}
              </span>
            </div>

            <div className="divide-y divide-zinc-100">
              {order.items.map((item, idx) => (
                <div
                  key={`${item.productId}-${idx}`}
                  className="flex items-center justify-between gap-3 py-2 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-contain p-0.5"
                        />
                      ) : (
                        <Package className="h-4 w-4 text-zinc-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-zinc-900">{item.name}</p>
                      <p className="text-[11px] text-zinc-500">
                        {item.sku ? `${item.sku} • ` : ''}
                        {formatTHB(item.unitPrice)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 font-semibold text-zinc-900">
                    {formatTHB(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-2 space-y-1 border-t border-zinc-100 pt-2.5 text-xs text-zinc-600">
              <div className="flex justify-between">
                <span>ราคาสินค้า</span>
                <span>{formatTHB(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>ค่าจัดส่ง</span>
                <span>{order.shippingFee > 0 ? formatTHB(order.shippingFee) : 'ฟรี'}</span>
              </div>
              <div className="flex justify-between pt-1 text-sm font-bold text-zinc-900">
                <span>ยอดรวมสุทธิ</span>
                <span>{formatTHB(order.total)}</span>
              </div>
            </div>
          </div>

          {/* อัปเดตสถานะและการจัดส่ง */}
          <div className="space-y-3 rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4">
            <span className="block text-xs font-bold uppercase tracking-wide text-zinc-800">
              อัปเดตสถานะและการจัดส่ง
            </span>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700">
                สถานะคำสั่งซื้อ
              </label>
              <select
                value={status}
                disabled={isTerminal}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 focus:border-amber-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"
              >
                {statusOptions.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_META[st].label} ({st})
                  </option>
                ))}
              </select>
              {status === 'delivered' && order.status !== 'delivered' && (
                <p className="mt-1 text-[11px] text-emerald-700">
                  เมื่อบันทึกเป็นส่งสำเร็จ ระบบจะปรับสถานะชำระเงิน COD เป็นชำระแล้วอัตโนมัติ
                </p>
              )}
              {status === 'cancelled' && order.status !== 'cancelled' && (
                <p className="mt-1 text-[11px] text-rose-600">
                  เมื่อยกเลิกคำสั่งซื้อ ระบบจะคืนสต็อกสินค้ากลับเข้าคลังโดยอัตโนมัติ
                </p>
              )}
            </div>

            {!isTerminal && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700">
                    บริษัทขนส่ง
                  </label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="เช่น Flash Express, Kerry, ไปรษณีย์ไทย"
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none"
                  />
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {CARRIER_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setCarrier(preset)}
                        className={`rounded-lg border px-2 py-0.5 text-[11px] font-medium transition ${
                          carrier === preset
                            ? 'border-amber-500 bg-amber-500 text-white'
                            : 'border-zinc-200 bg-white text-zinc-600 hover:border-amber-400 hover:text-amber-700'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-700">
                    เลขพัสดุ (Tracking Number)
                  </label>
                  <input
                    type="text"
                    value={trackingNo}
                    onChange={(e) => setTrackingNo(e.target.value)}
                    placeholder="กรอกเลขพัสดุ..."
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/70 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
          >
            ปิด
          </button>
          {!isTerminal && (
            <button
              type="button"
              disabled={!hasChanges || saving}
              onClick={handleSave}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-amber-500 px-5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}