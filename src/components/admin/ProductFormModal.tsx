'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Brand, Category, Product, ProductFormInput, ProductStatus } from '@/types/voltcraft';

interface ProductFormModalProps {
  isOpen: boolean;
  editingProduct: Product | null;
  categories: Category[];
  brands: Brand[];
  onClose: () => void;
  onSave: (input: ProductFormInput) => boolean;
}

interface AttributeRow {
  key: string;
  value: string;
}

export function ProductFormModal({
  isOpen,
  editingProduct,
  categories,
  brands,
  onClose,
  onSave,
}: ProductFormModalProps) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('10');
  const [status, setStatus] = useState<ProductStatus>('active');
  const [imageUrl, setImageUrl] = useState('');
  const [attrRows, setAttrRows] = useState<AttributeRow[]>([
    { key: 'กำลังไฟ', value: '' },
  ]);

  useEffect(() => {
    if (!isOpen) return;
    if (editingProduct) {
      setSku(editingProduct.sku);
      setName(editingProduct.name);
      setDescription(editingProduct.description);
      setCategoryId(editingProduct.category._id);
      setBrandId(editingProduct.brand._id);
      setPrice(String(editingProduct.price));
      setSalePrice(editingProduct.salePrice ? String(editingProduct.salePrice) : '');
      setStock(String(editingProduct.stock));
      setStatus(editingProduct.status);
      setImageUrl(editingProduct.images[0] ?? '');
      const entries = Object.entries(editingProduct.attributes);
      setAttrRows(
        entries.length > 0
          ? entries.map(([key, value]) => ({ key, value }))
          : [{ key: 'กำลังไฟ', value: '' }]
      );
    } else {
      setSku('');
      setName('');
      setDescription('');
      setCategoryId(categories[0]?._id ?? '');
      setBrandId(brands[0]?._id ?? '');
      setPrice('');
      setSalePrice('');
      setStock('10');
      setStatus('active');
      setImageUrl('');
      setAttrRows([
        { key: 'กำลังไฟ', value: '' },
        { key: 'รับประกัน', value: '' },
      ]);
    }
  }, [isOpen, editingProduct, categories, brands]);

  if (!isOpen) return null;

  const handleAddAttrRow = () => {
    setAttrRows((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleUpdateAttr = (idx: number, field: 'key' | 'value', val: string) => {
    setAttrRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: val } : row))
    );
  };

  const handleRemoveAttr = (idx: number) => {
    setAttrRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const attributes: Record<string, string> = {};
    attrRows.forEach((row) => {
      if (row.key.trim() && row.value.trim()) {
        attributes[row.key.trim()] = row.value.trim();
      }
    });

    const ok = onSave({
      _id: editingProduct?._id,
      sku,
      name,
      description,
      categoryId,
      brandId,
      price: Number(price) || 0,
      salePrice: salePrice ? Number(salePrice) : undefined,
      images: imageUrl.trim() ? [imageUrl.trim()] : [],
      attributes,
      status,
      stock: Number(stock) || 0,
    });

    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-zinc-900/45 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-zinc-200 bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4">
          <h3 className="text-base font-bold text-zinc-900">
            {editingProduct ? 'Edit Appliance' : 'Add New Appliance'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700">SKU</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="VC-AC-12000"
                className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700">
              Product Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mitsubishi Inverter Air Conditioner 12,000 BTU"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 focus:border-amber-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700">
                Category
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700">
                Brand
              </label>
              <select
                required
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              >
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700">
                Price (THB ฿)
              </label>
              <input
                type="number"
                min={0}
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700">
                Sale Price (THB ฿)
              </label>
              <input
                type="number"
                min={0}
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Optional"
                className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700">
                Stock Quantity
              </label>
              <input
                type="number"
                min={0}
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700">
              Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 focus:border-amber-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700">
              Description
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-900 focus:border-amber-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Dynamic Attributes */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-700">
                Specification Attributes
              </span>
              <button
                type="button"
                onClick={handleAddAttrRow}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-200"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="space-y-2">
              {attrRows.map((row, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={row.key}
                    onChange={(e) => handleUpdateAttr(idx, 'key', e.target.value)}
                    placeholder="Key (e.g. กำลังไฟ)"
                    className="h-10 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus:border-amber-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => handleUpdateAttr(idx, 'value', e.target.value)}
                    placeholder="Value (e.g. 1500W)"
                    className="h-10 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAttr(idx)}
                    aria-label="Remove attribute row"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-11 rounded-xl bg-amber-500 px-6 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
            >
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}