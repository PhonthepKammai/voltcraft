'use client';

import React, { useMemo, useState } from 'react';
import { Package } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { Order, OrderStatus } from '@/types/voltcraft';
import { OrderFilterBar, OrderFilterKey } from './orders/OrderFilterBar';
import { OrderCard } from './orders/OrderCard';
import { OrderManageModal } from './orders/OrderManageModal';
import { getOrderCustomerName } from './orders/orderUtils';

export function AdminOrdersTab() {
  const { orders, adminActions } = useStore();
  const [filterStatus, setFilterStatus] = useState<OrderFilterKey>('all');
  const [search, setSearch] = useState('');
  const [managing, setManaging] = useState<{
    order: Order;
    presetStatus?: OrderStatus;
  } | null>(null);
  const [quickUpdatingId, setQuickUpdatingId] = useState<string | null>(null);

  const statusCounts = useMemo(() => {
    const counts: Record<OrderFilterKey, number> = {
      all: orders.length,
      pending: 0,
      paid: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const o of orders) {
      if (o.status in counts) counts[o.status] += 1;
    }
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (filterStatus !== 'all' && o.status !== filterStatus) return false;
      if (!q) return true;
      const haystack = [
        o.orderNo,
        getOrderCustomerName(o),
        o.shippingAddress?.phone,
        o.shippingAddress?.province,
        o.shipment?.trackingNo,
        o.shipment?.carrier,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, filterStatus, search]);

  const handleQuickDeliver = async (order: Order) => {
    try {
      setQuickUpdatingId(order._id);
      await adminActions.updateOrderShipment(order._id, {
        status: 'delivered',
        carrier: order.shipment?.carrier ?? '',
        trackingNo: order.shipment?.trackingNo ?? '',
      });
    } finally {
      setQuickUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <OrderFilterBar
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
        statusCounts={statusCounts}
        search={search}
        onSearchChange={setSearch}
      />

      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center">
          <Package className="mx-auto mb-2 h-8 w-8 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-600">
            ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไข
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onManage={(target, presetStatus) =>
                setManaging({ order: target, presetStatus })
              }
              onQuickDeliver={handleQuickDeliver}
              isQuickUpdating={quickUpdatingId === order._id}
            />
          ))}
        </div>
      )}

      {managing && (
        <OrderManageModal
          key={`${managing.order._id}-${managing.presetStatus ?? 'view'}`}
          order={managing.order}
          initialStatus={managing.presetStatus}
          onClose={() => setManaging(null)}
        />
      )}
    </div>
  );
}