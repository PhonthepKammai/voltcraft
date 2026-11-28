'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TaxonomyPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (nextPage: number) => void;
}

export function TaxonomyPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: TaxonomyPaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  // สร้างรายการเลขหน้า (แสดงย่อด้วย ... ถ้ายาว)
  const pages: Array<number | '...'> = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3.5 text-xs">
      <span className="text-zinc-500">
        แสดง <strong className="font-semibold text-zinc-800">{start}-{end}</strong> จาก{' '}
        <strong className="font-semibold text-zinc-800">{totalItems}</strong> รายการ
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="หน้าก่อนหน้า"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`dots-${idx}`} className="px-1.5 text-zinc-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`h-8 min-w-8 rounded-lg px-2 font-semibold transition ${
                p === page
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-amber-50 hover:text-amber-700'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="หน้าถัดไป"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}