'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Brand, Category, Order, Product, Review } from '@/types/voltcraft';
import { useCartState } from '@/hooks/useCart';
import { useAdminActions } from '@/hooks/useAdminActions';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/apiClient';

interface StoreContextValue {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  orders: Order[];
  reviews: Review[];
  isLoading: boolean;
  refreshStore: () => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cart: ReturnType<typeof useCartState>;
  adminActions: ReturnType<typeof useAdminActions>;
  checkoutWithCod: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, navigateTo } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

 

  const refreshStore = useCallback(async () => {
    try {
      setIsLoading(true);
      const [ prodRes, catRes, brandRes ] = await Promise.all([
        api<{ items: Product[]}>('/api/products?limit=100'),
        api<Category[]>('/api/categories'),
        api<Brand[]>('/api/brands'),
      ])

      setProducts(prodRes.items ?? []);
      setCategories(catRes ?? []);
      setBrands(brandRes ?? []);
    } catch (e) {
      console.error('Failed to load store data:', e);
      showToast('โหลดข้อมูลร้านค้าไม่สำเร็จ', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast])

  useEffect(() => {
    refreshStore();
  }, [refreshStore]);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    api<{ items: Order[] }>('/api/orders')
      .then((res) => setOrders(res.items ?? []))
      .catch((e) => console.error('Failed to load orders:', e));
  }, [user]);

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

  const checkoutWithCod = useCallback(async () => {
    if(cart.items.length === 0) {
      showToast('ไม่มีสินค้าในตะกร้า', 'error');
      return;
    }

    if (!user) {
      setIsCartOpen(false);
      navigateTo('auth');
      showToast('โปรดเข้าสู่ระบบเพื่อดำเนินการต่อ', 'info');
      return;
    }

    try {
      const { order } = await api<{ order: Order }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: cart.items.map((i) => ({
            productId: i.product._id,
            quantity: i.quantity,
          })),
          shippingAddress: user.addresses[0],
          paymentMethod: 'cod',
        }),
      });

      setOrders((prev) => [order, ...prev]);
      cart.clearCart();
      setIsCartOpen(false);
      await refreshStore(); // โหลดสต็อกสินค้าล่าสุดจาก DB
      showToast(`Order ${order.orderNo} created.`, 'success');
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  }, [cart, user, navigateTo, showToast, refreshStore]);

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        brands,
        orders,
        reviews,
        isLoading,
        refreshStore,
        selectedProduct,
        setSelectedProduct,
        isCartOpen,
        setIsCartOpen,
        cart,
        adminActions,
        checkoutWithCod,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}