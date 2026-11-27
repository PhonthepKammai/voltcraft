'use client';

import React from 'react';
import { X, ShoppingBag, MapPin, CreditCard } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { formatTHB } from '@/lib/format';
import { CartItemRow } from '@/components/cart/CartItemRow';

export function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cart, checkoutWithCod } = useStore();
  const { user } = useAuth();

  if (!isCartOpen) return null;

  const primaryAddress = user?.addresses[0];

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-zinc-900/45 backdrop-blur-[2px]">
      <div className="flex h-full w-full max-w-md flex-col bg-zinc-50 shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-bold text-zinc-900">
              Your Cart ({cart.itemCount})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <ShoppingBag className="h-7 w-7" />
              </span>
              <p className="mt-3 text-sm font-semibold text-zinc-900">
                Your shopping cart is empty
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Add electrical appliances to start your order.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.items.map((item) => (
                <CartItemRow
                  key={item.product._id}
                  item={item}
                  onUpdateQty={cart.updateQuantity}
                  onRemove={cart.removeFromCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* Summary & Checkout Footer */}
        {cart.items.length > 0 && (
          <div className="border-t border-zinc-200 bg-white p-5">
            {/* Shipping Address Preview */}
            <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
                <MapPin className="h-3.5 w-3.5 text-amber-600" />
                <span>Shipping Address</span>
              </div>
              {primaryAddress ? (
                <p className="mt-1 leading-relaxed text-zinc-600">
                  {primaryAddress.recipient} ({primaryAddress.phone}) —{' '}
                  {primaryAddress.line1}, {primaryAddress.subdistrict},{' '}
                  {primaryAddress.district}, {primaryAddress.province}{' '}
                  {primaryAddress.postalCode}
                </p>
              ) : (
                <p className="mt-1 text-zinc-500">
                  Sign in at checkout to use your saved Thai delivery address.
                </p>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span className="font-medium text-zinc-900">
                  {formatTHB(cart.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>Shipping Fee</span>
                <span className="font-medium text-emerald-600">
                  {cart.shippingFee === 0 ? 'Free' : formatTHB(cart.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between border-t border-zinc-100 pt-2.5 text-base font-bold text-zinc-900">
                <span>Total (THB)</span>
                <span>{formatTHB(cart.total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={checkoutWithCod}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
            >
              <CreditCard className="h-4 w-4" />
              <span>Proceed to Stripe Checkout</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}