'use client';

import React from 'react';
import { ShoppingCart, Star } from 'lucide-react';
import { Product } from '@/types/voltcraft';
import { formatTHB, getDiscountPercent, getEffectivePrice } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onSelect, onAddToCart }: ProductCardProps) {
  const effectivePrice = getEffectivePrice(product.price, product.salePrice);
  const discount = getDiscountPercent(product.price, product.salePrice);
  const previewAttrs = Object.entries(product.attributes).slice(0, 2);
  const outOfStock = product.stock <= 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-amber-300 hover:shadow-md">
      {/* Image */}
      <button
        type="button"
        onClick={() => onSelect(product)}
        className="relative aspect-[4/3] w-full p-4 overflow-hidden bg-white text-left"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
        />
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          {discount && <Badge variant="amber">-{discount}%</Badge>}
          {outOfStock ? (
            <Badge variant="rose">Out of Stock</Badge>
          ) : product.stock < 5 ? (
            <Badge variant="amber">Only {product.stock} left</Badge>
          ) : null}
        </div>
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="zinc">{product.brand.name}</Badge>
          <span className="truncate text-[11px] font-medium text-zinc-400">
            {product.category.name}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onSelect(product)}
          className="mt-2 line-clamp-2 text-left text-sm font-semibold text-zinc-900 transition hover:text-amber-600 sm:text-[15px]"
        >
          {product.name}
        </button>

        {/* Key Attributes Preview */}
        {previewAttrs.length > 0 && (
          <div className="mt-2.5 space-y-1 rounded-xl bg-zinc-50 p-2 text-xs">
            {previewAttrs.map(([key, val]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="truncate text-zinc-500">{key}</span>
                <span className="truncate font-medium text-zinc-800">{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Rating & Stock */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-zinc-700">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span className="font-semibold">{product.ratingAvg.toFixed(1)}</span>
            <span className="text-zinc-400">({product.ratingCount})</span>
          </div>
          <span
            className={`font-medium ${
              outOfStock ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
          </span>
        </div>

        {/* Price & CTA */}
        <div className="mt-auto pt-3.5">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-zinc-900 sm:text-lg">
              {formatTHB(effectivePrice)}
            </span>
            {discount && (
              <span className="text-xs text-zinc-400 line-through">
                {formatTHB(product.price)}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={outOfStock}
            onClick={() => onAddToCart(product)}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>{outOfStock ? 'Unavailable' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}