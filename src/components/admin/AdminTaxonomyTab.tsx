'use client';

import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  CornerDownRight,
  FolderTree,
  Layers,
  Plus,
  Search,
  Tag,
  X,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { TaxonomyImageInput } from './taxonomy/TaxonomyImageInput';
import { TaxonomyPagination } from './taxonomy/TaxonomyPagination';
import { TaxonomyRowActions } from './taxonomy/TaxonomyRowActions';
import { EditTarget, TaxonomyEditModal } from './taxonomy/TaxonomyEditModal';
import { buildCategoryTree } from './taxonomy/categoryTree';

const PAGE_SIZE = 10;

export function AdminTaxonomyTab() {
  const { categories, brands, products, adminActions } = useStore();

  // --- Category Form & List State ---
  const categoryInputRef = useRef<HTMLInputElement | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [categoryImage, setCategoryImage] = useState('');
  const [uploadingCategory, setUploadingCategory] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryPage, setCategoryPage] = useState(1);

  // --- Brand Form & List State ---
  const [newBrand, setNewBrand] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [uploadingBrand, setUploadingBrand] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [brandPage, setBrandPage] = useState(1);

  // --- Modal แก้ไข ---
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const productCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const id = p.category?._id;
      if (id) map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [products]);

  const productCountByBrand = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const id = p.brand?._id;
      if (id) map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [products]);

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  const parentOptions = useMemo(
    () =>
      categoryTree.filter(
        (node) =>
          node.category.slug !== 'uncategorized' &&
          node.category.isActive !== false
      ),
    [categoryTree]
  );

  const filteredCategoryNodes = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categoryTree;
    return categoryTree.filter(
      (n) =>
        n.category.name.toLowerCase().includes(q) ||
        n.category.slug.toLowerCase().includes(q) ||
        n.pathLabel.toLowerCase().includes(q)
    );
  }, [categoryTree, categorySearch]);

  const totalCategoryPages = Math.max(1, Math.ceil(filteredCategoryNodes.length / PAGE_SIZE));
  const safeCategoryPage = Math.min(categoryPage, totalCategoryPages);
  const paginatedCategories = useMemo(
    () =>
      filteredCategoryNodes.slice(
        (safeCategoryPage - 1) * PAGE_SIZE,
        safeCategoryPage * PAGE_SIZE
      ),
    [filteredCategoryNodes, safeCategoryPage]
  );

  const filteredBrands = useMemo(() => {
    const q = brandSearch.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q)
    );
  }, [brands, brandSearch]);

  const totalBrandPages = Math.max(1, Math.ceil(filteredBrands.length / PAGE_SIZE));
  const safeBrandPage = Math.min(brandPage, totalBrandPages);
  const paginatedBrands = useMemo(
    () =>
      filteredBrands.slice(
        (safeBrandPage - 1) * PAGE_SIZE,
        safeBrandPage * PAGE_SIZE
      ),
    [filteredBrands, safeBrandPage]
  );

  useEffect(() => setCategoryPage(1), [categorySearch]);
  useEffect(() => setBrandPage(1), [brandSearch]);

  const subCategoryCount = categoryTree.filter((n) => n.depth > 0).length;
  const activeBrandCount = brands.filter((b) => b.isActive !== false).length;

  const handleQuickCreateSubcategory = (parentId: string) => {
    setParentCategoryId(parentId);
    categoryInputRef.current?.focus();
    categoryInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim() || uploadingCategory) return;

    const ok = await adminActions.addCategory({
      name: newCategory.trim(),
      image: categoryImage.trim(),
      parentId: parentCategoryId || null,
    });

    if (ok !== false) {
      setNewCategory('');
      setCategoryImage('');
      setParentCategoryId('');
      setCategoryPage(1);
    }
  };

  const handleAddBrand = async (e: FormEvent) => {
    e.preventDefault();
    if (!newBrand.trim() || !brandLogo.trim() || uploadingBrand) return;

    const ok = await adminActions.addBrand({
      name: newBrand.trim(),
      logo: brandLogo.trim(),
    });

    if (ok !== false) {
      setNewBrand('');
      setBrandLogo('');
      setBrandPage(1);
    }
  };

  return (
    <div className="space-y-6">
      {/* แถบสรุป */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">หมวดหมู่ทั้งหมด</span>
            <Layers className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-zinc-900">{categories.length}</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">
            หมวดหลัก {categories.length - subCategoryCount} • หมวดย่อย {subCategoryCount}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">หมวดหมู่ย่อยซ้อน</span>
            <FolderTree className="h-4 w-4 text-sky-500" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-zinc-900">{subCategoryCount}</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">จัดกลุ่มสินค้าเป็นลำดับชั้นย่อย</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">แบรนด์ทั้งหมด</span>
            <Tag className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-zinc-900">{brands.length}</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">
            เปิดใช้งาน {activeBrandCount} • ปิดใช้งาน {brands.length - activeBrandCount}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">สินค้าในระบบ</span>
            <Layers className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-zinc-900">{products.length}</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">
            ลบได้เฉพาะรายการที่ไม่มีสินค้าใช้งาน
          </p>
        </div>
      </div>

      {/* 2 คอลัมน์: Categories & Brands */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* ==================== CATEGORIES ==================== */}
        <section className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                หมวดหมู่สินค้า ({categories.length})
              </h3>
              <p className="text-[11px] text-zinc-500">
                สร้างได้ทั้งหมวดหลักและหมวดย่อยซ้อนกัน
              </p>
            </div>
          </div>

          <form
            onSubmit={handleAddCategory}
            className="mt-4 space-y-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700">
                  ชื่อหมวดหมู่ <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={categoryInputRef}
                  type="text"
                  required
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="เช่น แอร์ติดผนัง, ตู้เย็น 2 ประตู..."
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-700">
                  อยู่ภายใต้หมวดหมู่ (ไม่บังคับ)
                </label>
                <select
                  value={parentCategoryId}
                  onChange={(e) => setParentCategoryId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus:border-amber-500 focus:outline-none"
                >
                  <option value="">— เป็นหมวดหมู่หลัก (ระดับบนสุด) —</option>
                  {parentOptions.map((node) => (
                    <option key={node.category._id} value={node.category._id}>
                      {'— '.repeat(node.depth)}
                      {node.pathLabel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <TaxonomyImageInput
              label="ไอคอน / รูปหมวดหมู่ (ไม่บังคับ)"
              scope="categories"
              value={categoryImage}
              onChange={setCategoryImage}
              onUploadingChange={setUploadingCategory}
              previewClassName="h-11 w-11"
              placeholder="วาง URL ไอคอน หรือกด Upload..."
            />

            <div className="flex items-center justify-between gap-2 pt-1">
              {parentCategoryId ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700">
                  <CornerDownRight className="h-3.5 w-3.5" />
                  กำลังสร้างเป็นหมวดย่อย
                  <button
                    type="button"
                    onClick={() => setParentCategoryId('')}
                    className="ml-1 text-sky-600 hover:text-sky-900"
                    title="เปลี่ยนเป็นหมวดหลัก"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : (
                <span />
              )}

              <button
                type="submit"
                disabled={!newCategory.trim() || uploadingCategory}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-amber-500 px-4 text-xs font-semibold text-white shadow-xs hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>{parentCategoryId ? 'เพิ่มหมวดย่อย' : 'เพิ่มหมวดหมู่'}</span>
              </button>
            </div>
          </form>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="ค้นหาชื่อหมวดหมู่ หรือ slug..."
              className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-8 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:outline-none"
            />
            {categorySearch && (
              <button
                type="button"
                onClick={() => setCategorySearch('')}
                aria-label="ล้างคำค้นหาหมวดหมู่"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {paginatedCategories.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-zinc-200 py-8 text-center text-xs text-zinc-400">
              ไม่พบหมวดหมู่ที่ค้นหา
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-100">
              {paginatedCategories.map(({ category: cat, depth, parentName, childCount }) => {
                const isSystem = cat.slug === 'uncategorized';
                const isActive = cat.isActive !== false;
                const count = productCountByCategory.get(cat._id) ?? 0;
                const indentPx = Math.min(depth, 3) * 20;

                return (
                  <li
                    key={cat._id}
                    className={`flex items-center justify-between gap-2 py-2.5 ${
                      !isActive ? 'opacity-60' : ''
                    }`}
                  >
                    <div
                      className="flex min-w-0 items-center gap-2.5"
                      style={{ paddingLeft: `${indentPx}px` }}
                    >
                      {depth > 0 && (
                        <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      )}

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <Layers className="h-4 w-4 text-zinc-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-zinc-900">
                            {cat.name}
                          </p>
                          {depth > 0 && parentName && (
                            <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
                              ย่อยของ {parentName}
                            </span>
                          )}
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
                        <p className="truncate text-[11px] text-zinc-400">
                          /{cat.slug} • {count} สินค้า
                          {childCount > 0 ? ` • ${childCount} หมวดย่อย` : ''}
                        </p>
                      </div>
                    </div>

                    <TaxonomyRowActions
                      isSystem={isSystem}
                      isActive={isActive}
                      productCount={count}
                      childCount={childCount}
                      onAddSubcategory={() => handleQuickCreateSubcategory(cat._id)}
                      onEdit={() => setEditTarget({ kind: 'category', item: cat })}
                      onToggleActive={(next) => adminActions.toggleCategoryActive(cat._id, next)}
                      onDelete={() => adminActions.deleteCategory(cat._id)}
                    />
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-auto">
            <TaxonomyPagination
              page={safeCategoryPage}
              pageSize={PAGE_SIZE}
              totalItems={filteredCategoryNodes.length}
              onPageChange={setCategoryPage}
            />
          </div>
        </section>

        {/* ==================== BRANDS ==================== */}
        <section className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Tag className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                แบรนด์สินค้า ({brands.length})
              </h3>
              <p className="text-[11px] text-zinc-500">
                จัดการยี่ห้อและโลโก้สำหรับแสดงหน้าร้านค้า
              </p>
            </div>
          </div>

          <form
            onSubmit={handleAddBrand}
            className="mt-4 space-y-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700">
                ชื่อแบรนด์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="เช่น Samsung, LG, Mitsubishi..."
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <TaxonomyImageInput
              label="โลโก้แบรนด์ (Brand Logo)"
              required
              scope="brands"
              value={brandLogo}
              onChange={setBrandLogo}
              onUploadingChange={setUploadingBrand}
              previewClassName="h-11 w-16"
              placeholder="วาง URL โลโก้ หรือกด Upload..."
            />

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!newBrand.trim() || !brandLogo.trim() || uploadingBrand}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-amber-500 px-4 text-xs font-semibold text-white shadow-xs hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>เพิ่มแบรนด์</span>
              </button>
            </div>
          </form>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              placeholder="ค้นหาชื่อแบรนด์ หรือ slug..."
              className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-8 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:outline-none"
            />
            {brandSearch && (
              <button
                type="button"
                onClick={() => setBrandSearch('')}
                aria-label="ล้างคำค้นหาแบรนด์"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {paginatedBrands.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-zinc-200 py-8 text-center text-xs text-zinc-400">
              ไม่พบแบรนด์ที่ค้นหา
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-100">
              {paginatedBrands.map((brand) => {
                const isSystem = brand.slug === 'unbranded';
                const isActive = brand.isActive !== false;
                const count = productCountByBrand.get(brand._id) ?? 0;

                return (
                  <li
                    key={brand._id}
                    className={`flex items-center justify-between gap-2 py-2.5 ${
                      !isActive ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white">
                        {brand.logo ? (
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <Tag className="h-4 w-4 text-zinc-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-zinc-900">
                            {brand.name}
                          </p>
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
                        <p className="truncate text-[11px] text-zinc-400">
                          /{brand.slug} • {count} สินค้า
                        </p>
                      </div>
                    </div>

                    <TaxonomyRowActions
                      isSystem={isSystem}
                      isActive={isActive}
                      productCount={count}
                      onEdit={() => setEditTarget({ kind: 'brand', item: brand })}
                      onToggleActive={(next) => adminActions.toggleBrandActive(brand._id, next)}
                      onDelete={() => adminActions.deleteBrand(brand._id)}
                    />
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-auto">
            <TaxonomyPagination
              page={safeBrandPage}
              pageSize={PAGE_SIZE}
              totalItems={filteredBrands.length}
              onPageChange={setBrandPage}
            />
          </div>
        </section>
      </div>

      {/* Modal แก้ไข Category / Brand */}
      {editTarget && (
        <TaxonomyEditModal
          key={`${editTarget.kind}-${editTarget.item._id}`}
          target={editTarget}
          parentOptions={parentOptions}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}