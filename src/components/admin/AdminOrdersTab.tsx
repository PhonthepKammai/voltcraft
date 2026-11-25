'use client';

import React, { useMemo, useState } from 'react';
import { Truck, Check } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { Order, OrderStatus } from '@/types/voltcraft';
import { formatDateTH, formatTHB } from '@/lib/format';
import { Badge, BadgeVariant } from '@/components/ui/Badge';

const FILTER_STATUSES: ('all' | OrderStatus)[] = [
  'all',
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
];

const STATUS_BADGE: Record<OrderStatus, BadgeVariant> = {
  pending: 'amber',
  paid: 'emerald',
  shipped: 'amber',
  delivered: 'emerald',
  cancelled: 'rose',
};

function OrderShipmentEditor({ order }: { order: Order }) {
  const { adminActions } = useStore();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [carrier, setCarrier] = useState(order.shipment.carrier ?? '');
  const [trackingNo, setTrackingNo] = useState(order.shipment.trackingNo ?? '');

  return (
    <div className="mt-4 grid grid-cols-1 gap-2.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:grid-cols-4">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as OrderStatus)}
        aria-label="Order status"
        className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-900 focus:border-amber-500 focus:outline-none"
      >
        <option value="pending">Pending</option>
        <option value="paid">Paid</option>
        <option value="shipped">Shipped</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <input
        type="text"
        value={carrier}
        onChange={(e) => setCarrier(e.target.value)}
        placeholder="Carrier (e.g. Kerry, Flash)"
        className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none"
      />

      <input
        type="text"
        value={trackingNo}
        onChange={(e) => setTrackingNo(e.target.value)}
        placeholder="Tracking Number"
        className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none"
      />

      <button
        type="button"
        onClick={() =>
          adminActions.updateOrderShipment(order._id, {
            status,
            carrier,
            trackingNo,
          })
        }
        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 text-xs font-semibold text-white transition hover:bg-amber-600"
      >
        <Check className="h-3.5 w-3.5" />
        <span>Update Order</span>
      </button>
    </div>
  );
}

export function AdminOrdersTab() {
  const { orders } = useStore();
  const [filterStatus, setFilterStatus] = useState<'all' | OrderStatus>('all');

  const filteredOrders = useMemo(() => {
    if (filterStatus === 'all') return orders;
    return orders.filter((o) => o.status === filterStatus);
  }, [orders, filterStatus]);

  return (
    <div className="space-y-4">
      {/* Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FILTER_STATUSES.map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilterStatus(st)}
            className={`h-9 shrink-0 rounded-full px-4 text-xs font-semibold capitalize transition ${
              filterStatus === st
                ? 'bg-amber-500 text-white'
                : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-amber-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Order Cards */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
            No orders match the selected status filter.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order._id}
              className="rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-zinc-900">{order.orderNo}</h4>
                    <Badge variant={STATUS_BADGE[order.status]}>{order.status}</Badge>
                    <Badge
                      variant={
                        order.payment.status === 'paid'
                          ? 'emerald'
                          : order.payment.status === 'refunded'
                            ? 'rose'
                            : 'amber'
                      }
                    >
                      Stripe: {order.payment.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {order.customerName} • {formatDateTH(order.createdAt)} •{' '}
                    {order.shippingAddress.province}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-base font-bold text-zinc-900">
                    {formatTHB(order.total)}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {order.items.length} item{order.items.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Items preview */}
              <div className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3 text-xs">
                {order.items.map((item) => (
                  <div key={item.sku} className="flex justify-between text-zinc-700">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-semibold text-zinc-900">
                      {formatTHB(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              {order.shipment.trackingNo && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  <Truck className="h-3.5 w-3.5" />
                  <span>
                    {order.shipment.carrier}: {order.shipment.trackingNo}
                  </span>
                </div>
              )}

              <OrderShipmentEditor order={order} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}