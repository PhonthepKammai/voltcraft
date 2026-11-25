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
} from '@/types/voltcraft';
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

  // --- Product CRUD ---
  const saveProduct = useCallback(
    (input: ProductFormInput) => {
      const category = categories.find((c) => c._id === input.categoryId);
      const brand = brands.find((b) => b._id === input.brandId);

      if (!category || !brand) {
        showToast('Please select a valid category and brand.', 'error');
        return false;
      }

      if (input._id) {
        setProducts((prev) =>
          prev.map((prod) =>
            prod._id === input._id
              ? {
                  ...prod,
                  sku: input.sku.trim(),
                  name: input.name.trim(),
                  slug: slugify(input.name),
                  description: input.description.trim(),
                  category,
                  brand,
                  price: input.price,
                  salePrice: input.salePrice || undefined,
                  images: input.images.length > 0 ? input.images : prod.images,
                  attributes: input.attributes,
                  status: input.status,
                  stock: input.stock,
                }
              : prod
          )
        );
        showToast(`Updated product "${input.name.trim()}".`, 'success');
      } else {
        const newProduct: Product = {
          _id: `prd-${Date.now()}`,
          sku: input.sku.trim(),
          name: input.name.trim(),
          slug: slugify(input.name),
          description: input.description.trim(),
          category,
          brand,
          price: input.price,
          salePrice: input.salePrice || undefined,
          images:
            input.images.length > 0
              ? input.images
              : [
                  'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=900&q=80',
                ],
          attributes: input.attributes,
          status: input.status,
          ratingAvg: 5.0,
          ratingCount: 0,
          stock: input.stock,
        };
        setProducts((prev) => [newProduct, ...prev]);
        showToast(`Created product "${newProduct.name}".`, 'success');
      }
      return true;
    },
    [categories, brands, setProducts, showToast]
  );

  const updateProductStock = useCallback(
    (productId: string, stock: number) => {
      const safeStock = Math.max(0, Math.floor(stock));
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, stock: safeStock } : p))
      );
      showToast(`Stock updated to ${safeStock}.`, 'success');
    },
    [setProducts, showToast]
  );

  const deleteProduct = useCallback(
    (productId: string) => {
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      showToast('Product deleted.', 'info');
    },
    [setProducts, showToast]
  );

  // --- Categories & Brands ---
  const addCategory = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        showToast('Category name is required.', 'error');
        return;
      }
      const slug = slugify(trimmed);
      setCategories((prev) => [
        ...prev,
        { _id: `cat-${Date.now()}`, name: trimmed, slug },
      ]);
      showToast(`Category "${trimmed}" added.`, 'success');
    },
    [setCategories, showToast]
  );

  const deleteCategory = useCallback(
    (categoryId: string) => {
      setCategories((prev) => prev.filter((c) => c._id !== categoryId));
      showToast('Category removed.', 'info');
    },
    [setCategories, showToast]
  );

  const addBrand = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        showToast('Brand name is required.', 'error');
        return;
      }
      const slug = slugify(trimmed);
      setBrands((prev) => [...prev, { _id: `brd-${Date.now()}`, name: trimmed, slug }]);
      showToast(`Brand "${trimmed}" added.`, 'success');
    },
    [setBrands, showToast]
  );

  const deleteBrand = useCallback(
    (brandId: string) => {
      setBrands((prev) => prev.filter((b) => b._id !== brandId));
      showToast('Brand removed.', 'info');
    },
    [setBrands, showToast]
  );

  // --- Order Status & Shipment ---
  const updateOrderShipment = useCallback(
    (
      orderId: string,
      payload: { status: OrderStatus; carrier: string; trackingNo: string }
    ) => {
      const now = new Date().toISOString();
      setOrders((prev) =>
        prev.map((order) => {
          if (order._id !== orderId) return order;
          return {
            ...order,
            status: payload.status,
            payment:
              payload.status === 'cancelled'
                ? { ...order.payment, status: 'refunded' }
                : payload.status === 'paid' && order.payment.status === 'unpaid'
                  ? { ...order.payment, status: 'paid', paidAt: now }
                  : order.payment,
            shipment: {
              ...order.shipment,
              carrier: payload.carrier.trim() || order.shipment.carrier,
              trackingNo: payload.trackingNo.trim() || order.shipment.trackingNo,
              shippedAt:
                payload.status === 'shipped'
                  ? order.shipment.shippedAt ?? now
                  : order.shipment.shippedAt,
              deliveredAt:
                payload.status === 'delivered'
                  ? order.shipment.deliveredAt ?? now
                  : order.shipment.deliveredAt,
            },
          };
        })
      );
      showToast('Order status and shipment details updated.', 'success');
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

  return {
    saveProduct,
    updateProductStock,
    deleteProduct,
    addCategory,
    deleteCategory,
    addBrand,
    deleteBrand,
    updateOrderShipment,
    replyToReview,
    toggleReviewStatus,
  };
}