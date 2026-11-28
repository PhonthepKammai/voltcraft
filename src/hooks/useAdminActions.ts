'use client';

import { Dispatch, SetStateAction, useCallback } from 'react';
import {
  Brand,
  Category,
  Order,
  OrderStatus,
  Product,
  ProductFormInput,
  Review,
  UpdateBrandInput,
  UpdateCategoryInput,
} from '@/types/voltcraft';
import { api } from '@/lib/apiClient';
import { slugify } from '@/lib/format';
import { useToast } from '@/context/ToastContext';

interface AdminActionsParams {
  categories: Category[];
  brands: Brand[];
  setProducts: Dispatch<SetStateAction<Product[]>>;
  setCategories: Dispatch<SetStateAction<Category[]>>;
  setBrands: Dispatch<SetStateAction<Brand[]>>;
  setOrders: Dispatch<SetStateAction<Order[]>>;
  setReviews: Dispatch<SetStateAction<Review[]>>;
}

type ProductApiResponse = { product?: Product } | Product;

const errMsg = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

function extractProduct(
  res: ProductApiResponse,
  fallbackCategory?: Category,
  fallbackBrand?: Brand
): Product {
  const raw =
    res && typeof res === 'object' && 'product' in res && res.product
      ? res.product
      : (res as Product);

  return {
    ...raw,
    category: raw.category ?? fallbackCategory!,
    brand: raw.brand ?? fallbackBrand!,
    salePrice: raw.salePrice ?? undefined,
    images: Array.isArray(raw.images) ? raw.images : [],
    attributes: raw.attributes ?? {},
  };
}

export function useAdminActions({
  categories,
  brands,
  setProducts,
  setCategories,
  setBrands,
  setOrders,
  setReviews,
}: AdminActionsParams) {
  const { showToast } = useToast();

  // --- Product CRUD (เชื่อม Database จริงผ่าน /api/products) ---
  const saveProduct = useCallback(
    async (input: ProductFormInput): Promise<boolean> => {
      const category = categories.find((c) => c._id === input.categoryId);
      const brand = brands.find((b) => b._id === input.brandId);

      if (!category || !brand) {
        showToast('Please select a valid category and brand.', 'error');
        return false;
      }

      const hasSale =
        input.salePrice !== undefined &&
        input.salePrice > 0 &&
        input.salePrice < input.price;

      const payload = {
        sku: input.sku.trim(),
        name: input.name.trim(),
        description: input.description.trim(),
        categoryId: input.categoryId,
        brandId: input.brandId,
        price: input.price,
        stock: input.stock,
        images: input.images,
        attributes: input.attributes,
        status: input.status,
        sale: hasSale
          ? { isActive: true, type: 'fixed', value: input.price - input.salePrice! }
          : null,
      };

      try {
        if (input._id) {
          const res = await api<ProductApiResponse>(`/api/products/${input._id}`, {
            method: 'PATCH',
            credentials: 'include',
            body: JSON.stringify(payload),
          });
          const updated = extractProduct(res, category, brand);

          setProducts((prev) =>
            prev.map((prod) => (prod._id === input._id ? updated : prod))
          );
          showToast(`Updated product "${updated.name}".`, 'success');
        } else {
          const res = await api<ProductApiResponse>('/api/products', {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify(payload),
          });
          const created = extractProduct(res, category, brand);

          setProducts((prev) => [created, ...prev]);
          showToast(`Created product "${created.name}".`, 'success');
        }
        return true;
      } catch (err) {
        showToast(errMsg(err, 'บันทึกข้อมูลสินค้าไม่สำเร็จ'), 'error');
        return false;
      }
    },
    [categories, brands, setProducts, showToast]
  );

  const updateProductStock = useCallback(
    async (productId: string, stock: number) => {
      const safeStock = Math.max(0, Math.floor(stock));
      try {
        const res = await api<ProductApiResponse>(`/api/products/${productId}`, {
          method: 'PATCH',
          credentials: 'include',
          body: JSON.stringify({ stock: safeStock }),
        });
        const updated =
          res && typeof res === 'object' && 'product' in res && res.product
            ? res.product
            : (res as Product);

        setProducts((prev) =>
          prev.map((p) =>
            p._id === productId ? { ...p, stock: updated?.stock ?? safeStock } : p
          )
        );
        showToast(`Stock updated to ${safeStock}.`, 'success');
      } catch (err) {
        showToast(errMsg(err, 'อัปเดตสต็อกไม่สำเร็จ'), 'error');
      }
    },
    [setProducts, showToast]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      try {
        const res = await api<{ archived?: boolean }>(`/api/products/${productId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (res?.archived) {
          setProducts((prev) =>
            prev.map((p) => (p._id === productId ? { ...p, status: 'archived' } : p))
          );
          showToast('สินค้ามีประวัติคำสั่งซื้อ ระบบเปลี่ยนสถานะเป็น Archived แทน', 'info');
        } else {
          setProducts((prev) => prev.filter((p) => p._id !== productId));
          showToast('Product deleted.', 'info');
        }
      } catch (err) {
        showToast(errMsg(err, 'ลบสินค้าไม่สำเร็จ'), 'error');
      }
    },
    [setProducts, showToast]
  );

  
  // --- Categories & Brands (เชื่อม DB จริง + รองรับ Disable / Delete) ---
  const addCategory = useCallback(
    async (input: {
    name: string;
    image?: string;
    parentId?: string | null;
  }) => {
      const trimmed = input.name.trim();
      if (!trimmed) {
        showToast('กรุณากรอกชื่อหมวดหมู่', 'error');
        return false;
      }
      try {
        const { category } = await api<{ category: Category }>('/api/categories', {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ name: trimmed, image: input.image?.trim() || '' }),
        });
        setCategories((prev) => [category, ...prev]);
        showToast(`เพิ่มหมวดหมู่ "${category.name}" เรียบร้อยแล้ว`, 'success');
        return true;
      } catch (err) {
        showToast(errMsg(err, 'เพิ่มหมวดหมู่ไม่สำเร็จ'), 'error');
        return false;
      }
    },
    [setCategories, showToast]
  );

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      try {
        const res = await api<{
          deleted: boolean;
          disabled: boolean;
          usedCount: number;
          category?: Category;
        }>(`/api/categories/${categoryId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (res.disabled && res.category) {
          setCategories((prev) =>
            prev.map((c) => (c._id === categoryId ? res.category! : c))
          );
          showToast(
            `มีสินค้า ${res.usedCount} รายการใช้อยู่ ปิดใช้งานหมวดหมู่นี้แทนการลบแล้ว`,
            'info'
          );
        } else {
          setCategories((prev) => prev.filter((c) => c._id !== categoryId));
          showToast('ลบหมวดหมู่เรียบร้อยแล้ว', 'info');
        }
      } catch (err) {
        showToast(errMsg(err, 'ไม่สามารถลบหมวดหมู่ได้'), 'error');
      }
    },
    [setCategories, showToast]
  );

  const toggleCategoryActive = useCallback(
    async (categoryId: string, nextActive: boolean) => {
      try {
        const { category } = await api<{ category: Category }>(
          `/api/categories/${categoryId}`,
          {
            method: 'PATCH',
            credentials: 'include',
            body: JSON.stringify({ isActive: nextActive }),
          }
        );
        setCategories((prev) =>
          prev.map((c) => (c._id === categoryId ? category : c))
        );
        showToast(
          nextActive ? 'เปิดใช้งานหมวดหมู่เรียบร้อยแล้ว' : 'ปิดใช้งานหมวดหมู่เรียบร้อยแล้ว',
          'success'
        );
      } catch (err) {
        showToast(errMsg(err, 'เปลี่ยนสถานะหมวดหมู่ไม่สำเร็จ'), 'error');
      }
    },
    [setCategories, showToast]
  );

  const addBrand = useCallback(
    async (input: { name: string; logo: string }) => {
      const trimmed = input.name.trim();
      const logo = input.logo.trim();
      if (!trimmed || !logo) {
        showToast('กรุณากรอกชื่อแบรนด์และรูปโลโก้', 'error');
        return false;
      }
      try {
        const { brand } = await api<{ brand: Brand }>('/api/brands', {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ name: trimmed, logo }),
        });
        setBrands((prev) => [brand, ...prev]);
        showToast(`เพิ่มแบรนด์ "${brand.name}" เรียบร้อยแล้ว`, 'success');
        return true;
      } catch (err) {
        showToast(errMsg(err, 'เพิ่มแบรนด์ไม่สำเร็จ'), 'error');
        return false;
      }
    },
    [setBrands, showToast]
  );

  const deleteBrand = useCallback(
    async (brandId: string) => {
      try {
        const res = await api<{
          deleted: boolean;
          disabled: boolean;
          usedCount: number;
          brand?: Brand;
        }>(`/api/brands/${brandId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (res.disabled && res.brand) {
          setBrands((prev) =>
            prev.map((b) => (b._id === brandId ? res.brand! : b))
          );
          showToast(
            `มีสินค้า ${res.usedCount} รายการใช้อยู่ ปิดใช้งานแบรนด์นี้แทนการลบแล้ว`,
            'info'
          );
        } else {
          setBrands((prev) => prev.filter((b) => b._id !== brandId));
          showToast('ลบแบรนด์เรียบร้อยแล้ว', 'info');
        }
      } catch (err) {
        showToast(errMsg(err, 'ไม่สามารถลบแบรนด์ได้'), 'error');
      }
    },
    [setBrands, showToast]
  );

  const toggleBrandActive = useCallback(
    async (brandId: string, nextActive: boolean) => {
      try {
        const { brand } = await api<{ brand: Brand }>(`/api/brands/${brandId}`, {
          method: 'PATCH',
          credentials: 'include',
          body: JSON.stringify({ isActive: nextActive }),
        });
        setBrands((prev) => prev.map((b) => (b._id === brandId ? brand : b)));
        showToast(
          nextActive ? 'เปิดใช้งานแบรนด์เรียบร้อยแล้ว' : 'ปิดใช้งานแบรนด์เรียบร้อยแล้ว',
          'success'
        );
      } catch (err) {
        showToast(errMsg(err, 'เปลี่ยนสถานะแบรนด์ไม่สำเร็จ'), 'error');
      }
    },
    [setBrands, showToast]
  );

  // --- Order Status & Shipment ---
  // --- Order Status & Shipment (เชื่อม DB จริงผ่าน PATCH /api/orders/:id) ---
  const updateOrderShipment = useCallback(
    async (
      orderId: string,
      payload: { status: OrderStatus; carrier: string; trackingNo: string }
    ): Promise<boolean> => {
      try {
        const updated = await api<Order>(`/api/orders/${orderId}`, {
          method: 'PATCH',
          credentials: 'include',
          body: JSON.stringify({
            status: payload.status,
            shipment: {
              carrier: payload.carrier.trim() || undefined,
              trackingNo: payload.trackingNo.trim() || undefined,
            },
          }),
        });

        setOrders((prev) =>
          prev.map((order) =>
            order._id === orderId
              ? {
                  ...order,
                  ...updated,
                  shipment: updated.shipment ?? {},
                }
              : order
          )
        );
        showToast('อัปเดตสถานะออเดอร์และข้อมูลจัดส่งเรียบร้อยแล้ว', 'success');
        return true;
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'อัปเดตออเดอร์ไม่สำเร็จ',
          'error'
        );
        return false;
      }
    },
    [setOrders, showToast]
  );

  // --- Review Moderation ---
  const replyToReview = useCallback(
    (reviewId: string, replyText: string) => {
      const trimmed = replyText.trim();
      if (!trimmed) {
        showToast('Reply message cannot be empty.', 'error');
        return;
      }
      setReviews((prev) =>
        prev.map((rev) =>
          rev._id === reviewId
            ? { ...rev, reply: { text: trimmed, at: new Date().toISOString() } }
            : rev
        )
      );
      showToast('Official store reply published.', 'success');
    },
    [setReviews, showToast]
  );

  const toggleReviewStatus = useCallback(
    (reviewId: string) => {
      setReviews((prev) =>
        prev.map((rev) =>
          rev._id === reviewId
            ? { ...rev, status: rev.status === 'published' ? 'hidden' : 'published' }
            : rev
        )
      );
      showToast('Review visibility updated.', 'info');
    },
    [setReviews, showToast]
  );

  const updateCategory = useCallback(
  async (categoryId: string, payload: UpdateCategoryInput): Promise<boolean> => {
    try {
      const { category } = await api<{ category: Category }>(
        `/api/categories/${categoryId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      );
      setCategories((prev) =>
        prev.map((c) => (c._id === categoryId ? category : c))
      );
      showToast(`บันทึกการแก้ไขหมวดหมู่ "${category.name}" แล้ว`, 'success');
      return true;
    } catch (err) {
      showToast(errMsg(err, 'แก้ไขหมวดหมู่ไม่สำเร็จ'), 'error');
      return false;
    }
  },
  [setCategories, showToast]
);

const updateBrand = useCallback(
  async (brandId: string, payload: UpdateBrandInput): Promise<boolean> => {
    try {
      const { brand } = await api<{ brand: Brand }>(`/api/brands/${brandId}`, {
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      setBrands((prev) => prev.map((b) => (b._id === brandId ? brand : b)));
      showToast(`บันทึกการแก้ไขแบรนด์ "${brand.name}" แล้ว`, 'success');
      return true;
    } catch (err) {
      showToast(errMsg(err, 'แก้ไขแบรนด์ไม่สำเร็จ'), 'error');
      return false;
    }
  },
  [setBrands, showToast]
);

  return {
    saveProduct,
    updateProductStock,
    deleteProduct,
    addCategory,
    deleteCategory,
    toggleCategoryActive,
    addBrand,
    deleteBrand,
    toggleBrandActive,
    updateOrderShipment,
    replyToReview,
    toggleReviewStatus,
    updateCategory,
    updateBrand,
  };
}