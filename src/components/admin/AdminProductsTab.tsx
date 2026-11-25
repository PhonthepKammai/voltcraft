'use client';

import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { Product } from '@/types/voltcraft';
import { formatTHB, getEffectivePrice } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { SearchBar } from '@/components/layout/SearchBar';
import { ProductFormModal } from '@/components/admin/ProductFormModal';

export function AdminProductsTab() {
  const { products, categories, brands, adminActions } = useStore();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.name.toLowerCase().includes(q)
    );
  }, [products, search]);

  const openCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search product name, SKU, or brand..."
          className="w-full sm:max-w-sm"
        />
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Responsive Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[740px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase text-zinc-500">
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Category / Brand</th>
                <th className="px-4 py-3 font-semibold">Price (THB)</th>
                <th className="px-4 py-3 font-semibold">Quick Stock</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((product) => (
                <tr key={product._id} className="hover:bg-zinc-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-12 w-12 shrink-0 rounded-xl border border-zinc-200 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="max-w-[240px] truncate font-semibold text-zinc-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-zinc-400">{product.sku}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <p className="text-zinc-800">{product.category.name}</p>
                    <p className="text-xs text-zinc-500">{product.brand.name}</p>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-bold text-zinc-900">
                      {formatTHB(getEffectivePrice(product.price, product.salePrice))}
                    </p>
                    {product.salePrice && product.salePrice < product.price && (
                      <p className="text-xs text-zinc-400 line-through">
                        {formatTHB(product.price)}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        defaultValue={product.stock}
                        onBlur={(e) => {
                          const next = Number(e.target.value);
                          if (!Number.isNaN(next) && next !== product.stock) {
                            adminActions.updateProductStock(product._id, next);
                          }
                        }}
                        aria-label={`Stock for ${product.name}`}
                        className="h-9 w-20 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 text-sm font-semibold text-zinc-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                      />
                      <Badge
                        variant={
                          product.stock === 0
                            ? 'rose'
                            : product.stock < 5
                              ? 'amber'
                              : 'emerald'
                        }
                      >
                        {product.stock === 0
                          ? 'Out'
                          : product.stock < 5
                            ? 'Low'
                            : 'OK'}
                      </Badge>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <Badge variant={product.status === 'active' ? 'emerald' : 'zinc'}>
                      {product.status}
                    </Badge>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                        aria-label="Edit product"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => adminActions.deleteProduct(product._id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ProductFormModal
        isOpen={modalOpen}
        editingProduct={editingProduct}
        categories={categories}
        brands={brands}
        onClose={() => setModalOpen(false)}
        onSave={adminActions.saveProduct}
      />
    </div>
  );
}