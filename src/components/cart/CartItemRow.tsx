'use client';

import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem } from '@/types/voltcraft';
import { formatTHB, getEffectivePrice } from '@/lib/format';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQty: (productId: string, nextQty: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItemRow({ item, onUpdateQty, onRemove }: CartItemRowProps) {
  const unitPrice = getEffectivePrice(item.product.price, item.product.salePrice);
  const lineTotal = unitPrice * item.quantity;

  return (
    <div className="flex gap-3.5 rounded-2xl border border-zinc-200 bg-white p-3">
      <img
        src={item.product.images[0]}
        alt={item.product.name}
        className="h-20 w-20 shrink-0 rounded-xl border border-zinc-100 object-cover"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-zinc-400">
              {item.product.brand.name}
            </p>
            <h4 className="line-clamp-2 text-sm font-semibold text-zinc-900">
              {item.product.name}
            </h4>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.product._id)}
            aria-label="Remove item"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="inline-flex items-center rounded-xl border border-zinc-200 bg-zinc-50">
            <button
              type="button"
              onClick={() => onUpdateQty(item.product._id, item.quantity - 1)}
              aria-label="Decrease quantity"
              className="flex h-8 w-8 items-center justify-center text-zinc-700 hover:text-amber-600"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-8 text-center text-xs font-bold text-zinc-900">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQty(item.product._id, item.quantity + 1)}
              aria-label="Increase quantity"
              className="flex h-8 w-8 items-center justify-center text-zinc-700 hover:text-amber-600"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="text-sm font-bold text-zinc-900">{formatTHB(lineTotal)}</span>
        </div>
      </div>
    </div>
  );
}