'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { Brand, Category, Order, Product, Review } from '@/types/voltcraft';
import {
  INITIAL_BRANDS,
  INITIAL_CATEGORIES,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
} from '@/lib/initialData';
import { useCartState } from '@/hooks/useCart';
import { useAdminActions } from '@/hooks/useAdminActions';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { getEffectivePrice } from '@/lib/format';

interface StoreContextValue {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  orders: Order[];
  reviews: Review[];
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cart: ReturnType<typeof useCartState>;
  adminActions: ReturnType<typeof useAdminActions>;
  checkoutWithStripe: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, navigateTo } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cart = useCartState();
  const adminActions = useAdminActions({
    categories,
    brands,
    setProducts,
    setCategories,
    setBrands,
    setOrders,
    setReviews,
  });

  const checkoutWithStripe = useCallback(() => {
    if (cart.items.length === 0) {
      showToast('Your cart is empty.', 'error');
      return;
    }
    if (!user) {
      setIsCartOpen(false);
      navigateTo('auth');
      showToast('Please sign in to proceed to Stripe Checkout.', 'info');
      return;
    }

    const now = new Date().toISOString();
    const orderNo = `VC-2611-${String(124 + orders.length).padStart(6, '0')}`;

    const newOrder: Order = {
      _id: `ord-${Date.now()}`,
      orderNo,
      customerName: user.name,
      items: cart.items.map((item) => {
        const unitPrice = getEffectivePrice(item.product.price, item.product.salePrice);
        return {
          productId: item.product._id,
          sku: item.product.sku,
          name: item.product.name,
          image: item.product.images[0],
          unitPrice,
          quantity: item.quantity,
          lineTotal: unitPrice * item.quantity,
        };
      }),
      shippingAddress: user.addresses[0] ?? {
        recipient: user.name,
        phone: user.phone,
        line1: '128/45 Sukhumvit 71 Rd.',
        subdistrict: 'Phra Khanong Nuea',
        district: 'Watthana',
        province: 'Bangkok',
        postalCode: '10110',
      },
      subtotal: cart.subtotal,
      shippingFee: cart.shippingFee,
      total: cart.total,
      status: 'paid',
      payment: {
        method: 'stripe',
        status: 'paid',
        paidAt: now,
      },
      shipment: {},
      createdAt: now,
    };

    // Deduct stock from products
    setProducts((prev) =>
      prev.map((prod) => {
        const ordered = cart.items.find((i) => i.product._id === prod._id);
        if (!ordered) return prod;
        return { ...prod, stock: Math.max(0, prod.stock - ordered.quantity) };
      })
    );

    setOrders((prev) => [newOrder, ...prev]);
    cart.clearCart();
    setIsCartOpen(false);
    showToast(`Stripe payment confirmed! Order ${orderNo} created.`, 'success');
  }, [cart, user, orders.length, navigateTo, showToast]);

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        brands,
        orders,
        reviews,
        selectedProduct,
        setSelectedProduct,
        isCartOpen,
        setIsCartOpen,
        cart,
        adminActions,
        checkoutWithStripe,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within StoreProvider');
  }
  return ctx;
}