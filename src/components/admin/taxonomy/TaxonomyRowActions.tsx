'use client';

import React from 'react';
import {
  Ban,
  FolderPlus,
  Lock,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react';

interface TaxonomyRowActionsProps {
  isSystem: boolean;
  isActive: boolean;
  productCount: number;
  childCount?: number;
  onAddSubcategory?: () => void;
  onEdit: () => void;
  onToggleActive: (nextActive: boolean) => void;
  onDelete: () => void;
}

export function TaxonomyRowActions({
  isSystem,
  isActive,
  productCount,
  childCount = 0,
  onAddSubcategory,
  onEdit,
  onToggleActive,
  onDelete,
}: TaxonomyRowActionsProps) {
  if (isSystem) {
    return (
      <span
        title="ค่าเริ่มต้นของระบบ ไม่สามารถแก้ไข ลบ หรือปิดใช้งานได้"
        className="flex h-8 w-8 items-center justify-center text-zinc-300"
      >
        <Lock className="h-4 w-4" />
      </span>
    );
  }

  const canDelete = productCount === 0 && childCount === 0;

  return (
    <div className="flex shrink-0 items-center gap-1">
      {onAddSubcategory && isActive && (
        <button
          type="button"
          onClick={onAddSubcategory}
          title="เพิ่มหมวดย่อย"
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 text-[11px] font-medium text-zinc-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
        >
          <FolderPlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">หมวดย่อย</span>
        </button>
      )}

      <button
        type="button"
        onClick={onEdit}
        title="แก้ไข"
        aria-label="แก้ไข"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>

      {isActive ? (
        <button
          type="button"
          onClick={() => onToggleActive(false)}
          title="ปิดใช้งานชั่วคราว"
          aria-label="ปิดใช้งาน"
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-100"
        >
          <Ban className="h-3.5 w-3.5" />
          <span className="hidden md:inline">ปิดใช้งาน</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onToggleActive(true)}
          title="เปิดใช้งานอีกครั้ง"
          aria-label="เปิดใช้งาน"
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden md:inline">เปิดใช้งาน</span>
        </button>
      )}

      <button
        type="button"
        disabled={!canDelete}
        onClick={onDelete}
        title={
          childCount > 0
            ? 'มีหมวดหมู่ย่อยอยู่ ลบไม่ได้'
            : productCount > 0
              ? 'มีสินค้าใช้งานอยู่ ลบไม่ได้ (ใช้ปุ่มปิดใช้งานแทน)'
              : 'ลบออกจากระบบ'
        }
        aria-label="ลบ"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}