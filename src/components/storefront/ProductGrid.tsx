'use client';

import React from 'react';
import { PackageSearch } from 'lucide-react';
import { Product } from '@/types/voltcraft';
import { ProductCard } from '@/components/storefront/ProductCard';

interface ProductGridProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onResetFilters: () => void;
}

export function ProductGrid({
  products,
  onSelectProduct,
  onAddToCart,
  onResetFilters,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <PackageSearch className="h-7 w-7" />
          </span>
          <h3 className="mt-4 text-base font-semibold text-zinc-900">
            No matching appliances found
          </h3>
          <p className="mt-1 max-w-sm text-sm text-zinc-600">
            Try adjusting your search keywords, brand selection, or THB price range.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-5 h-11 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            Reset All Filters
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      id="product-catalog"
      className="mx-auto max-w-7xl px-4 py-6 sm:px-6"
    >
      <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onSelect={onSelectProduct}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </section>
  );
}