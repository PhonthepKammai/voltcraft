'use client';

import React, { FormEvent, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { Brand, Category } from '@/types/voltcraft';
import { useStore } from '@/context/StoreContext';
import { TaxonomyImageInput } from './TaxonomyImageInput';
import { CategoryTreeNode } from './categoryTree';

export type EditTarget =
  | { kind: 'category'; item: Category }
  | { kind: 'brand'; item: Brand };

interface TaxonomyEditModalProps {
  target: EditTarget;
  parentOptions: CategoryTreeNode[];
  onClose: () => void;
}

export function TaxonomyEditModal({
  target,
  parentOptions,
  onClose,
}: TaxonomyEditModalProps) {
  const { adminActions } = useStore();
  const isCategory = target.kind === 'category';
  const isSystem =
    target.item.slug === 'uncategorized' || target.item.slug === 'unbranded';

  const [name, setName] = useState(target.item.name);
  const [imageOrLogo, setImageOrLogo] = useState(
    isCategory ? target.item.image ?? '' : target.item.logo ?? ''
  );
  const [parentId, setParentId] = useState(
    isCategory && target.item.parentId ? String(target.item.parentId) : ''
  );
  const [isActive, setIsActive] = useState(target.item.isActive !== false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // กรองตัวเลือกหมวดแม่ไม่ให้เลือกตัวเอง
  const availableParents = parentOptions.filter(
    (node) => node.category._id !== target.item._id
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (uploading || saving) return;

    const trimmedName = name.trim();
    const trimmedMedia = imageOrLogo.trim();
    if (!trimmedName) return;
    if (!isCategory && !trimmedMedia) return;

    try {
      setSaving(true);
      let ok = false;

      if (isCategory) {
        ok = await adminActions.updateCategory(target.item._id, {
          name: trimmedName,
          image: trimmedMedia,
          parentId: parentId || null,
          isActive,
        });
      } else {
        ok = await adminActions.updateBrand(target.item._id, {
          name: trimmedName,
          logo: trimmedMedia,
          isActive,
        });
      }

      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900">
              {isCategory ? 'แก้ไขหมวดหมู่สินค้า' : 'แก้ไขแบรนด์สินค้า'}
            </h3>
            <p className="font-mono text-xs text-zinc-400">/{target.item.slug}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-700">
              {isCategory ? 'ชื่อหมวดหมู่' : 'ชื่อแบรนด์'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isSystem}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-900 focus:border-amber-500 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:bg-zinc-100"
            />
          </div>

          {isCategory && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-700">
                หมวดหมู่หลัก (Parent Category)
              </label>
              <select
                disabled={isSystem}
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs text-zinc-900 focus:border-amber-500 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:bg-zinc-100"
              >
                <option value="">— เป็นหมวดหมู่หลัก (ระดับบนสุด) —</option>
                {availableParents.map((node) => (
                  <option key={node.category._id} value={node.category._id}>
                    {'— '.repeat(node.depth)}
                    {node.pathLabel}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isSystem && (
            <TaxonomyImageInput
              label={isCategory ? 'ไอคอน / รูปหมวดหมู่' : 'โลโก้แบรนด์ (Brand Logo)'}
              required={!isCategory}
              scope={isCategory ? 'categories' : 'brands'}
              value={imageOrLogo}
              onChange={setImageOrLogo}
              onUploadingChange={setUploading}
              previewClassName={isCategory ? 'h-12 w-12' : 'h-12 w-16'}
            />
          )}

          {!isSystem && (
            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-zinc-900">สถานะการใช้งาน</p>
                <p className="text-[11px] text-zinc-500">
                  {isActive
                    ? 'เปิดใช้งาน: แสดงในหน้าร้านค้าและตัวเลือกสร้างสินค้า'
                    : 'ปิดใช้งาน: ซ่อนจากหน้าร้านค้าชั่วคราว'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 accent-amber-500"
              />
            </label>
          )}

          <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving || uploading || !name.trim() || (!isCategory && !imageOrLogo.trim())}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-amber-500 px-5 text-xs font-semibold text-white shadow-xs hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}