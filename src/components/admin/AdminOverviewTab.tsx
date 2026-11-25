'use client';

import React from 'react';
import { Banknote, Package, AlertTriangle, Truck } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { formatDateTH, formatTHB } from '@/lib/format';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { OrderStatus } from '@/types/voltcraft';

const STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  pending: 'amber',
  paid: 'emerald',
  shipped: 'amber',
  delivered: 'emerald',
  cancelled: 'rose',
};

export function AdminOverviewTab() {
  const { orders, products } = useStore();

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled' && o.payment.status === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  const paidAwaitingShipment = orders.filter((o) => o.status === 'paid').length;
  const lowStockProducts = products.filter((p) => p.stock < 5);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Total Revenue
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Banknote className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-900">
            {formatTHB(totalRevenue)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Paid Stripe orders (THB)</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Awaiting Shipment
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Truck className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-900">{paidAwaitingShipment}</p>
          <p className="mt-1 text-xs text-zinc-500">Paid orders ready to dispatch</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Total Products
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
              <Package className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-zinc-900">{products.length}</p>
          <p className="mt-1 text-xs text-zinc-500">Active & archived catalog SKUs</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Low Stock Alerts
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-rose-600">
            {lowStockProducts.length}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Products with stock &lt; 5 units</p>
        </div>
      </div>

      {/* Recent Orders + Low Stock */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-zinc-900">Recent Orders</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs uppercase text-zinc-400">
                  <th className="pb-2.5 font-semibold">Order No</th>
                  <th className="pb-2.5 font-semibold">Customer</th>
                  <th className="pb-2.5 font-semibold">Date</th>
                  <th className="pb-2.5 font-semibold">Status</th>
                  <th className="pb-2.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order._id}>
                    <td className="py-3 font-semibold text-zinc-900">{order.orderNo}</td>
                    <td className="py-3 text-zinc-600">{order.customerName}</td>
                    <td className="py-3 text-zinc-500">{formatDateTH(order.createdAt)}</td>
                    <td className="py-3">
                      <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
                    </td>
                    <td className="py-3 text-right font-bold text-zinc-900">
                      {formatTHB(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-bold text-zinc-900">Low Stock Watchlist</h3>
          {lowStockProducts.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">All products are well-stocked.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {lowStockProducts.map((item) => (
                <li
                  key={item._id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-rose-100 bg-rose-50/40 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-zinc-500">{item.sku}</p>
                  </div>
                  <Badge variant="rose">{item.stock} left</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}