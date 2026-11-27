'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { OrderStatus } from '@/types/voltcraft';

export type OrderFilterKey = 'all' | OrderStatus;

interface OrderFilterBarProps {
  filterStatus: OrderFilterKey;
  onFilterChange: (next: OrderFilterKey) => void;
  statusCounts: Record<OrderFilterKey, number>;
  search: string;
  onSearchChange: (value: string) => void;
}

export function OrderFilterBar({
  filterStatus,
  onFilterChange,
  statusCounts,
  search,
  onSearchChange,
}: OrderFilterBarProps) {
  const tabs: Array<{ key: OrderFilterKey; label: string }> = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'pending', label: 'รอจัดส่ง' },
    ...(statusCounts.paid > 0
      ? [{ key: 'paid' as const, label: 'ชำระแล้ว' }]
      : []),
    { key: 'shipped', label: 'กำลังจัดส่ง' },
    { key: 'delivered', label: 'ส่งสำเร็จ' },
    { key: 'cancelled', label: 'ยกเลิก' },
  ];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 lg:pb-0">
        {tabs.map((tab) => {
          const active = filterStatus === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onFilterChange(tab.key)}
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
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ค้นหาเลขออเดอร์, ชื่อ, เบอร์, เลขพัสดุ..."
          className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-8 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="ล้างคำค้นหา"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}