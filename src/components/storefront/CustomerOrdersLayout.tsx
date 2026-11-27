'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Package,
  Search,
  ShoppingBag,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { Order, OrderItem, OrderStatus } from '@/types/voltcraft';
import { api } from '@/lib/apiClient';
import { CustomerOrderCard } from './orders/CustomerOrderCard';
import { ReviewModal } from './orders/ReviewModal';

type FilterKey = 'all' | OrderStatus;

interface CustomerOrdersLayoutProps {
  onBack?: () => void;
}

export function CustomerOrdersLayout({ onBack }: CustomerOrdersLayoutProps) {
  const { user, navigateTo } = useAuth();
  const { orders, refreshStore } = useStore();

  const [filterStatus, setFilterStatus] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [reviewedKeys, setReviewedKeys] = useState<Set<string>>(new Set());
  const [reviewTarget, setReviewTarget] = useState<{
    order: Order;
    item: OrderItem;
  } | null>(null);

  const handleBack = () => {
    if (onBack) onBack();
    else navigateTo('storefront');
  };

  // โหลดรายการสินค้าที่ลูกค้ารีวิวไปแล้ว
  useEffect(() => {
    if (!user) return;
    api<Array<{ orderId: string; productId: string }>>('/api/reviews?mine=true', {
      credentials: 'include',
    })
      .then((list) => {
        if (Array.isArray(list)) {
          setReviewedKeys(
            new Set(list.map((r) => `${String(r.orderId)}:${String(r.productId)}`))
          );
        }
      })
      .catch(() => {
        // กรณียังไม่ได้เพิ่ม GET /api/reviews ให้ทำงานต่อได้ตามปกติ
      });
  }, [user]);

  const statusCounts = useMemo(() => {
    const counts: Record<FilterKey, number> = {
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

  const tabs: Array<{ key: FilterKey; label: string }> = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'pending', label: 'รอจัดส่ง' },
    { key: 'shipped', label: 'กำลังจัดส่ง' },
    { key: 'delivered', label: 'จัดส่งสำเร็จ' },
    { key: 'cancelled', label: 'ยกเลิก' },
  ];

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (filterStatus !== 'all' && o.status !== filterStatus) return false;
      if (!q) return true;
      const haystack = [
        o.orderNo,
        o.shipment?.trackingNo,
        o.shipment?.carrier,
        ...o.items.map((i) => i.name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, filterStatus, search]);

  const handleReviewSubmitted = async (orderId: string, productId: string) => {
    setReviewedKeys((prev) => new Set(prev).add(`${orderId}:${productId}`));
    await refreshStore();
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top Bar ของหน้าคำสั่งซื้อ */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>กลับหน้าร้าน</span>
            </button>

            <div className="min-w-0 border-l border-zinc-200 pl-3">
              <h1 className="truncate text-sm font-bold text-zinc-900 sm:text-base">
                คำสั่งซื้อของฉัน
              </h1>
              <p className="hidden text-[11px] text-zinc-500 sm:block">
                ติดตามสถานะจัดส่งและเขียนรีวิวสินค้าที่ได้รับแล้ว
              </p>
            </div>
          </div>

          {user && (
            <button
              type="button"
              onClick={() => navigateTo('profile')}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs font-semibold text-zinc-700 transition hover:border-amber-400 hover:bg-white"
            >
              <UserIcon className="h-3.5 w-3.5 text-zinc-500" />
              <span className="hidden sm:inline">{user.name}</span>
              <span className="sm:hidden">โปรไฟล์</span>
            </button>
          )}
        </div>
      </header>

      {/* เนื้อหาหลัก */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {!user ? (
          <div className="mx-auto max-w-md rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-xs">
            <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-zinc-300" />
            <h2 className="text-base font-bold text-zinc-900">กรุณาเข้าสู่ระบบ</h2>
            <p className="mt-1 text-sm text-zinc-500">
              เข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อและเขียนรีวิวสินค้าของคุณ
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                กลับหน้าร้าน
              </button>
              <button
                type="button"
                onClick={() => navigateTo('auth')}
                className="h-10 rounded-xl bg-amber-500 px-5 text-xs font-semibold text-white hover:bg-amber-600"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* แถบกรองสถานะ + ช่องค้นหา */}
            <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 lg:pb-0">
                {tabs.map((tab) => {
                  const active = filterStatus === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setFilterStatus(tab.key)}
                      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-xs font-semibold transition ${
                        active
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-zinc-100 text-zinc-600 hover:bg-amber-50 hover:text-amber-700'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          active ? 'bg-white/25 text-white' : 'bg-white text-zinc-600'
                        }`}
                      >
                        {statusCounts[tab.key]}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full lg:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาเลขออเดอร์, ชื่อสินค้า, เลขพัสดุ..."
                  className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-8 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="ล้างคำค้นหา"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* รายการคำสั่งซื้อ */}
            {filteredOrders.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center">
                <Package className="mx-auto mb-2 h-9 w-9 text-zinc-300" />
                <p className="text-sm font-medium text-zinc-600">
                  {search.trim()
                    ? 'ไม่พบคำสั่งซื้อที่ตรงกับคำค้นหา'
                    : 'ยังไม่มีคำสั่งซื้อในสถานะนี้'}
                </p>
                <button
                  type="button"
                  onClick={handleBack}
                  className="mt-4 h-9 rounded-xl bg-amber-500 px-4 text-xs font-semibold text-white hover:bg-amber-600"
                >
                  กลับไปเลือกซื้อสินค้า
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <CustomerOrderCard
                    key={order._id}
                    order={order}
                    reviewedKeys={reviewedKeys}
                    onOpenReview={(targetOrder, targetItem) =>
                      setReviewTarget({ order: targetOrder, item: targetItem })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal รีวิวสินค้า */}
      {reviewTarget && (
        <ReviewModal
          orderId={reviewTarget.order._id}
          orderNo={reviewTarget.order.orderNo}
          item={reviewTarget.item}
          onClose={() => setReviewTarget(null)}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}