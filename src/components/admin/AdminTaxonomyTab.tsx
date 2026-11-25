'use client';

import React, { FormEvent, useState } from 'react';
import { Plus, Trash2, Tag, Layers } from 'lucide-react';
import { useStore } from '@/context/StoreContext';

export function AdminTaxonomyTab() {
  const { categories, brands, adminActions } = useStore();
  const [newCategory, setNewCategory] = useState('');
  const [newBrand, setNewBrand] = useState('');

  const handleAddCategory = (e: FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    adminActions.addCategory(newCategory);
    setNewCategory('');
  };

  const handleAddBrand = (e: FormEvent) => {
    e.preventDefault();
    if (!newBrand.trim()) return;
    adminActions.addBrand(newBrand);
    setNewBrand('');
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Categories Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-bold text-zinc-900">
            Categories ({categories.length})
          </h3>
        </div>

        <form onSubmit={handleAddCategory} className="mt-4 flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name..."
            className="h-11 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white hover:bg-amber-600"
          >
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </button>
        </form>

        <ul className="mt-4 divide-y divide-zinc-100">
          {categories.map((cat) => (
            <li key={cat._id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-semibold text-zinc-900">{cat.name}</p>
                <p className="text-xs text-zinc-400">/{cat.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => adminActions.deleteCategory(cat._id)}
                aria-label={`Delete category ${cat.name}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Brands Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-bold text-zinc-900">Brands ({brands.length})</h3>
        </div>

        <form onSubmit={handleAddBrand} className="mt-4 flex gap-2">
          <input
            type="text"
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
            placeholder="New brand name..."
            className="h-11 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white hover:bg-amber-600"
          >
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </button>
        </form>

        <ul className="mt-4 divide-y divide-zinc-100">
          {brands.map((brand) => (
            <li key={brand._id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-semibold text-zinc-900">{brand.name}</p>
                <p className="text-xs text-zinc-400">/{brand.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => adminActions.deleteBrand(brand._id)}
                aria-label={`Delete brand ${brand.name}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}