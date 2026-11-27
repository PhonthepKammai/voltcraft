'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  activeCategories: Category[];
  activeBrands: Brand[];
  orders: Order[];
  reviews: Review[];
  isLoading: boolean;
  refreshStore: () => Promise<void>;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cart: ReturnType<typeof useCartState>;
  adminActions: ReturnType<typeof useAdminActions>;
  checkoutWithCod: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

type CategoriesRes = Category[] | { categories?: Category[]; items?: Category[] };
type BrandsRes = Brand[] | { brands?: Brand[]; items?: Brand[] };

function unwrapList<T>(res: T[] | { items?: T[]; [key: string]: unknown }, key: string): T[] {
  if (Array.isArray(res)) return res;
  const byKey = res?.[key];
  if (Array.isArray(byKey)) return byKey as T[];
  if (Array.isArray(res?.items)) return res.items;
  return [];
}

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

  const isAdmin = user?.role === 'admin';

  const refreshStore = useCallback(async () => {
    try {
      setIsLoading(true);
      const productUrl = isAdmin
        ? '/api/products?limit=100&status=all'
        : '/api/products?limit=100';
      const categoryUrl = isAdmin
        ? '/api/categories?includeInactive=true'
        : '/api/categories';
      const brandUrl = isAdmin
        ? '/api/brands?includeInactive=true'
        : '/api/brands';

      const [prodRes, catRes, brandRes] = await Promise.all([
        api<{ items: Product[] }>(productUrl, { credentials: 'include' }),
        api<CategoriesRes>(categoryUrl, { credentials: 'include' }),
        api<BrandsRes>(brandUrl, { credentials: 'include' }),
      ]);

      setProducts(prodRes.items ?? []);
      setCategories(unwrapList<Category>(catRes, 'categories'));
      setBrands(unwrapList<Brand>(brandRes, 'brands'));
    } catch (e) {
      console.error('Failed to load store data:', e);
      showToast('โหลดข้อมูลร้านค้าไม่สำเร็จ', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, showToast]);

  useEffect(() => {
    refreshStore();
  }, [refreshStore]);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    api<Order[] | { items?: Order[]; orders?: Order[] }>('/api/orders', {
      credentials: 'include',
    })
      .then((res) => setOrders(unwrapList<Order>(res, 'orders')))
      .catch((e) => console.error('Failed to load orders:', e));
  }, [user]);

  // รายการที่เปิดใช้งานอยู่ (สำหรับหน้าร้านค้าและ Dropdown เลือกตอนสร้างสินค้าใหม่)
  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive !== false),
    [categories]
  );

  const activeBrands = useMemo(
    () => brands.filter((b) => b.isActive !== false),
    [brands]
  );

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
    if (cart.items.length === 0) {
      showToast('ไม่มีสินค้าในตะกร้า', 'error');
      return;
    }

    if (!user) {
      setIsCartOpen(false);
      navigateTo('auth');
      showToast('โปรดเข้าสู่ระบบเพื่อดำเนินการต่อ', 'info');
      return;
    }

    const shippingAddress =
      user.addresses?.find((a) => a.isDefault) ?? user.addresses?.[0];

    if (!shippingAddress) {
      setIsCartOpen(false);
      navigateTo('profile');
      showToast('กรุณาเพิ่มที่อยู่จัดส่งในหน้าโปรไฟล์ก่อนสั่งซื้อ', 'error');
      return;
    }

    try {
      const { order } = await api<{ order: Order }>('/api/orders', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          items: cart.items.map((i) => ({
            productId: i.product._id,
            quantity: i.quantity,
          })),
          shippingAddress,
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
        activeCategories,
        activeBrands,
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