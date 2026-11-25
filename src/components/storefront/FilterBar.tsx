'use client';

import React from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Brand, Category } from '@/types/voltcraft';
import { PriceRangeKey } from '@/hooks/useProductFilters';

interface FilterBarProps {
  categories: Category[];
  brands: Brand[];
  categorySlug: string;
  onCategoryChange: (slug: string) => void;
  brandSlug: string;
  onBrandChange: (slug: string) => void;
  priceRange: PriceRangeKey;
  onPriceRangeChange: (range: PriceRangeKey) => void;
  inStockOnly: boolean;
  onInStockChange: (checked: boolean) => void;
  hasActiveFilters: boolean;
  onReset: () => void;
  resultCount: number;
}

export function FilterBar({
  categories,
  brands,
  categorySlug,
  onCategoryChange,
  brandSlug,
  onBrandChange,
  priceRange,
  onPriceRangeChange,
  inStockOnly,
  onInStockChange,
  hasActiveFilters,
  onReset,
  resultCount,
}: FilterBarProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      {/* Scrollable Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          type="button"
          onClick={() => onCategoryChange('all')}
          className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition ${
            categorySlug === 'all'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'border border-zinc-200 bg-white text-zinc-700 hover:border-amber-300 hover:bg-amber-50'
          }`}
        >
          All Appliances
        </button>

        {categories.map((cat) => {
          const active = categorySlug === cat.slug;
          return (
            <button
              key={cat._id}
              type="button"
              onClick={() => onCategoryChange(cat.slug)}
              className={`h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition ${
                active
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'border border-zinc-200 bg-white text-zinc-700 hover:border-amber-300 hover:bg-amber-50'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Brand, Price & Stock Controls */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter:
          </span>

          <select
            aria-label="Filter by brand"
            value={brandSlug}
            onChange={(e) => onBrandChange(e.target.value)}
            className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-800 focus:border-amber-500 focus:bg-white focus:outline-none"
          >
            <option value="all">All Brands</option>
            {brands.map((b) => (
              <option key={b._id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by THB price"
            value={priceRange}
            onChange={(e) => onPriceRangeChange(e.target.value as PriceRangeKey)}
            className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-800 focus:border-amber-500 focus:bg-white focus:outline-none"
          >
            <option value="all">All Prices (THB)</option>
            <option value="under-10k">Under ฿10,000</option>
            <option value="10k-25k">฿10,000 – ฿25,000</option>
            <option value="over-25k">Over ฿25,000</option>
          </select>

          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => onInStockChange(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-amber-500"
            />
            <span>In Stock Only</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-zinc-500">
            Showing <strong className="text-zinc-900">{resultCount}</strong> item
            {resultCount === 1 ? '' : 's'}
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}