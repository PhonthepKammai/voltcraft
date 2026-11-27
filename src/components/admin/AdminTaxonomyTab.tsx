'use client';

import React, { FormEvent, useRef, useState } from 'react';
import {
  Ban,
  ImageIcon,
  Layers,
  Link2,
  Loader2,
  Lock,
  Plus,
  RotateCcw,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { useImageUpload, type UploadScope } from '@/hooks/useImageUpload';

interface TaxonomyImageInputProps {
  label: string;
  required?: boolean;
  scope: UploadScope;
  value: string;
  onChange: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  previewClassName?: string;
  placeholder?: string;
}

function TaxonomyImageInput({
  label,
  required = false,
  scope,
  value,
  onChange,
  onUploadingChange,
  previewClassName = 'h-14 w-14',
  placeholder = 'วาง URL รูปภาพ หรือกดปุ่มอัปโหลด...',
}: TaxonomyImageInputProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadedUrlRef = useRef<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const { uploadFiles, deleteImage, uploading, deletingUrl } = useImageUpload({
    scope,
    maxFiles: 1,
  });

  const handleFileChange = async (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    onUploadingChange?.(true);

    try {
      const urls = await uploadFiles([file], 0);
      if (urls[0]) {
        // หากก่อนหน้านี้เพิ่งอัปโหลดรูปไว้แล้วยังไม่กด Add ให้ลบรูปเก่าบน Blob ทิ้ง
        if (uploadedUrlRef.current && uploadedUrlRef.current !== urls[0]) {
          await deleteImage(uploadedUrlRef.current);
        }
        uploadedUrlRef.current = urls[0];
        onChange(urls[0]);
      }
    } finally {
      URL.revokeObjectURL(preview);
      setLocalPreview(null);
      onUploadingChange?.(false);
    }
  };

  const handleClear = async () => {
    const current = value;
    onChange('');
    if (uploadedUrlRef.current && uploadedUrlRef.current === current) {
      uploadedUrlRef.current = null;
      await deleteImage(current);
    }
  };

  const displaySrc = localPreview || value.trim();
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-zinc-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      <div className="flex items-center gap-3">
        {/* กล่อง Preview รูป */}
        <div
          className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 ${previewClassName}`}
        >
          {displaySrc ? (
            <>
              <img
                src={displaySrc}
                alt={label}
                className={`h-full w-full object-contain p-1.5 ${
                  localPreview ? 'opacity-50' : ''
                }`}
              />
              {localPreview && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/20">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                </div>
              )}
              {!localPreview && (
                <button
                  type="button"
                  disabled={deletingUrl === value}
                  onClick={handleClear}
                  aria-label={`Clear ${label}`}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-md bg-white/90 text-rose-600 shadow-sm hover:bg-rose-600 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </>
          ) : (
            <ImageIcon className="h-5 w-5 text-zinc-300" />
          )}
        </div>

        {/* ช่องวาง URL + ปุ่มอัปโหลดไฟล์ */}
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="url"
              required={required}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              disabled={uploading}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:outline-none disabled:opacity-60"
            />
          </div>

          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:border-amber-400 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
            ) : (
              <Upload className="h-3.5 w-3.5 text-amber-600" />
            )}
            <span>{uploading ? 'Uploading' : 'Upload'}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={uploading}
            className="hidden"
            onChange={async (e) => {
              await handleFileChange(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function AdminTaxonomyTab() {
  const { categories, brands, products, adminActions } = useStore();

  const countProductsByCategory = (categoryId: string) =>
    products.filter((p) => p.category?._id === categoryId).length;

  const countProductsByBrand = (brandId: string) =>
    products.filter((p) => p.brand?._id === brandId).length;

  // Category Form State
  const [newCategory, setNewCategory] = useState('');
  const [categoryImage, setCategoryImage] = useState('');
  const [uploadingCategory, setUploadingCategory] = useState(false);

  // Brand Form State
  const [newBrand, setNewBrand] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [uploadingBrand, setUploadingBrand] = useState(false);

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim() || uploadingCategory) return;

    await adminActions.addCategory({
      name: newCategory.trim(),
      image: categoryImage.trim(),
    });
    setNewCategory('');
    setCategoryImage('');
  };

  const handleAddBrand = async (e: FormEvent) => {
    e.preventDefault();
    if (!newBrand.trim() || !brandLogo.trim() || uploadingBrand) return;

    await adminActions.addBrand({
      name: newBrand.trim(),
      logo: brandLogo.trim(),
    });
    setNewBrand('');
    setBrandLogo('');
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

        <form
          onSubmit={handleAddCategory}
          className="mt-4 space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3.5"
        >
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="เช่น เครื่องปรับอากาศ, ตู้เย็น..."
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <TaxonomyImageInput
            label="Category Icon / Image (Optional)"
            scope="categories"
            value={categoryImage}
            onChange={setCategoryImage}
            onUploadingChange={setUploadingCategory}
            previewClassName="h-12 w-12"
            placeholder="วาง URL ไอคอน หรือกด Upload..."
          />

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!newCategory.trim() || uploadingCategory}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
            </button>
          </div>
        </form>

        <ul className="mt-4 divide-y divide-zinc-100">
  {categories.map((cat) => {
    const isSystem = cat.slug === 'uncategorized';
    const isActive = cat.isActive !== false;
    const count = countProductsByCategory(cat._id);

    return (
      <li
        key={cat._id}
        className={`flex items-center justify-between gap-3 py-2.5 ${
          !isActive ? 'opacity-60' : ''
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
            {cat.image ? (
              <img src={cat.image} alt={cat.name} className="h-full w-full object-contain p-1" />
            ) : (
              <Layers className="h-4 w-4 text-zinc-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-zinc-900">{cat.name}</p>
              {isSystem && (
                <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600">
                  ค่าเริ่มต้นระบบ
                </span>
              )}
              {!isActive && (
                <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                  ปิดใช้งาน
                </span>
              )}
            </div>
            <p className="truncate text-xs text-zinc-400">
              /{cat.slug} • {count} สินค้า
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {isSystem ? (
            <span
              title="ค่าเริ่มต้นของระบบ ไม่สามารถลบหรือปิดใช้งานได้"
              className="flex h-9 w-9 items-center justify-center text-zinc-300"
            >
              <Lock className="h-4 w-4" />
            </span>
          ) : !isActive ? (
            <>
              <button
                type="button"
                onClick={() => adminActions.toggleCategoryActive(cat._id, true)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                เปิดใช้งาน
              </button>
              {count === 0 && (
                <button
                  type="button"
                  onClick={() => adminActions.deleteCategory(cat._id)}
                  title="ลบหมวดหมู่"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </>
          ) : count > 0 ? (
            <button
              type="button"
              onClick={() => adminActions.deleteCategory(cat._id)}
              title="มีสินค้าใช้งานอยู่ ระบบจะปิดใช้งานแทนการลบ"
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
            >
              <Ban className="h-3.5 w-3.5" />
              ปิดใช้งาน
            </button>
          ) : (
            <button
              type="button"
              onClick={() => adminActions.deleteCategory(cat._id)}
              title={`ลบหมวดหมู่ ${cat.name}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </li>
    );
  })}
</ul>
      </div>

      {/* Brands Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-bold text-zinc-900">Brands ({brands.length})</h3>
        </div>

        <form
          onSubmit={handleAddBrand}
          className="mt-4 space-y-3 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3.5"
        >
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700">
              Brand Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              placeholder="เช่น Samsung, LG, Mitsubishi..."
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <TaxonomyImageInput
            label="Brand Logo"
            required
            scope="brands"
            value={brandLogo}
            onChange={setBrandLogo}
            onUploadingChange={setUploadingBrand}
            previewClassName="h-12 w-16"
            placeholder="วาง URL โลโก้ หรือกด Upload..."
          />

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!newBrand.trim() || !brandLogo.trim() || uploadingBrand}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>Add Brand</span>
            </button>
          </div>
        </form>

        <ul className="mt-4 divide-y divide-zinc-100">
  {brands.map((brand) => {
    const isSystem = brand.slug === 'unbranded';
    const isActive = brand.isActive !== false;
    const count = countProductsByBrand(brand._id);

    return (
      <li
        key={brand._id}
        className={`flex items-center justify-between gap-3 py-2.5 ${
          !isActive ? 'opacity-60' : ''
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white">
            {brand.logo ? (
              <img src={brand.logo} alt={brand.name} className="h-full w-full object-contain p-1" />
            ) : (
              <Tag className="h-4 w-4 text-zinc-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-zinc-900">{brand.name}</p>
              {isSystem && (
                <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600">
                  ค่าเริ่มต้นระบบ
                </span>
              )}
              {!isActive && (
                <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                  ปิดใช้งาน
                </span>
              )}
            </div>
            <p className="truncate text-xs text-zinc-400">
              /{brand.slug} • {count} สินค้า
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {isSystem ? (
            <span
              title="ค่าเริ่มต้นของระบบ ไม่สามารถลบหรือปิดใช้งานได้"
              className="flex h-9 w-9 items-center justify-center text-zinc-300"
            >
              <Lock className="h-4 w-4" />
            </span>
          ) : !isActive ? (
            <>
              <button
                type="button"
                onClick={() => adminActions.toggleBrandActive(brand._id, true)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                เปิดใช้งาน
              </button>
              {count === 0 && (
                <button
                  type="button"
                  onClick={() => adminActions.deleteBrand(brand._id)}
                  title="ลบแบรนด์"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </>
          ) : count > 0 ? (
            <button
              type="button"
              onClick={() => adminActions.deleteBrand(brand._id)}
              title="มีสินค้าใช้งานอยู่ ระบบจะปิดใช้งานแทนการลบ"
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
            >
              <Ban className="h-3.5 w-3.5" />
              ปิดใช้งาน
            </button>
          ) : (
            <button
              type="button"
              onClick={() => adminActions.deleteBrand(brand._id)}
              title={`ลบแบรนด์ ${brand.name}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </li>
    );
  })}
</ul>
      </div>
    </div>
  );
}