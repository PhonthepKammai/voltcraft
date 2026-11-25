'use client';

import { useCallback, useMemo, useState } from 'react';
import { CartItem, Product } from '@/types/voltcraft';
import { getEffectivePrice } from '@/lib/format';
import { useToast } from '@/context/ToastContext';

const FREE_SHIPPING_THRESHOLD_THB = 10000;
const STANDARD_SHIPPING_FEE_THB = 150;

export function useCartState() {
  const { showToast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      if (product.stock <= 0) {
        showToast('This item is currently out of stock.', 'error');
        return;
      }

      let reachedLimit = false;
      setItems((prev) => {
        const existing = prev.find((i) => i.product._id === product._id);
        if (existing) {
          const nextQty = existing.quantity + quantity;
          if (nextQty > product.stock) {
            reachedLimit = true;
            return prev.map((i) =>
              i.product._id === product._id ? { ...i, quantity: product.stock } : i
            );
          }
          return prev.map((i) =>
            i.product._id === product._id ? { ...i, quantity: nextQty } : i
          );
        }
        return [...prev, { product, quantity: Math.min(quantity, product.stock) }];
      });

      if (reachedLimit) {
        showToast(`Maximum available stock (${product.stock}) reached.`, 'info');
      } else {
        showToast(`Added ${product.name} to cart.`, 'success');
      }
    },
    [showToast]
  );

  const updateQuantity = useCallback(
    (productId: string, nextQuantity: number) => {
      if (nextQuantity <= 0) {
        setItems((prev) => prev.filter((item) => item.product._id !== productId));
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.product._id !== productId) return item;
          if (nextQuantity > item.product.stock) {
            showToast(`Only ${item.product.stock} unit(s) available in stock.`, 'info');
            return { ...item, quantity: item.product.stock };
          }
          return { ...item, quantity: nextQuantity };
        })
      );
    },
    [showToast]
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      setItems((prev) => prev.filter((item) => item.product._id !== productId));
      showToast('Item removed from cart.', 'info');
    },
    [showToast]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + getEffectivePrice(item.product.price, item.product.salePrice) * item.quantity,
        0
      ),
    [items]
  );

  const shippingFee = useMemo(() => {
    if (items.length === 0) return 0;
    return subtotal >= FREE_SHIPPING_THRESHOLD_THB ? 0 : STANDARD_SHIPPING_FEE_THB;
  }, [items.length, subtotal]);

  const total = subtotal + shippingFee;

  return {
    items,
    itemCount,
    subtotal,
    shippingFee,
    total,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD_THB,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
}