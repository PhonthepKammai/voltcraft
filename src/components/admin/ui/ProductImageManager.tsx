'use client';

import React, { DragEvent, useEffect, useRef, useState } from 'react';
import {
  GripVertical,
  ImageIcon,
  Link2,
  Loader2,
  Plus,
  Star,
  Upload,
  X,
} from 'lucide-react';
import { useImageUpload, type UploadScope } from '@/hooks/useImageUpload';

interface ProductImageManagerProps {
  images: string[];
  onChange: (nextImages: string[]) => void;
  scope?: UploadScope;
  maxImages?: number;
  allowUrlInput?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
}

interface PendingPreview {
  id: string;
  previewUrl: string;
  name: string;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function ProductImageManager({
  images,
  onChange,
  scope = 'products',
  maxImages = 10,
  allowUrlInput = true,
  onUploadingChange,
}: ProductImageManagerProps) {
  const [pendingPreviews, setPendingPreviews] = useState<PendingPreview[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isFileDragging, setIsFileDragging] = useState(false);

  // State สำหรับลากจัดลำดับรูปภาพ
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const sessionUploadedRef = useRef<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { uploadFiles, deleteImage, uploading, deletingUrl, progress } = useImageUpload({
    scope,
    maxFiles: maxImages,
  });

  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  // คืนหน่วยความจำ local preview เมื่อ unmount
  useEffect(() => {
    return () => {
      pendingPreviews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalCount = images.length + pendingPreviews.length;

  // --- อัปโหลดไฟล์เข้า Vercel Blob ---
  const handleFilesSelected = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const previews: PendingPreview[] = files.map((file, idx) => ({
      id: `${Date.now()}-${idx}`,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
    }));

    setPendingPreviews((prev) => [...prev, ...previews]);

    try {
      const uploadedUrls = await uploadFiles(files, totalCount);
      if (uploadedUrls.length > 0) {
        uploadedUrls.forEach((u) => sessionUploadedRef.current.add(u));
        onChange([...images, ...uploadedUrls]);
      }
    } finally {
      previews.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      const ids = new Set(previews.map((p) => p.id));
      setPendingPreviews((prev) => prev.filter((p) => !ids.has(p.id)));
    }
  };

  const handleFileDragOver = (e: DragEvent<HTMLDivElement>) => {
    // ถ้าเป็นการลากรูปภายในเพื่อจัดลำดับ ไม่ต้องเปิดไฮไลต์ของโซนอัปโหลดไฟล์
    if (draggedIdx !== null || !e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    setIsFileDragging(true);
  };

  const handleFileDrop = async (e: DragEvent<HTMLDivElement>) => {
    if (draggedIdx !== null || !e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    setIsFileDragging(false);
    if (uploading || totalCount >= maxImages) return;
    if (e.dataTransfer.files?.length) {
      await handleFilesSelected(e.dataTransfer.files);
    }
  };

  // --- เพิ่มรูปด้วย URL โดยตรง (ไม่อัปโหลดเข้า Blob) ---
  const handleAddImageUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    if (!isValidHttpUrl(trimmed)) {
      setUrlError('กรุณากรอก URL ที่ขึ้นต้นด้วย http:// หรือ https://');
      return;
    }
    if (totalCount >= maxImages) {
      setUrlError(`เพิ่มรูปได้สูงสุด ${maxImages} รูป`);
      return;
    }
    if (images.includes(trimmed)) {
      setUrlError('มีรูป URL นี้อยู่แล้ว');
      return;
    }

    onChange([...images, trimmed]);
    setUrlInput('');
    setUrlError('');
  };

  // --- ลากสลับลำดับรูปใน Grid ---
  const handleItemDragStart = (e: DragEvent<HTMLDivElement>, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleItemDragOver = (e: DragEvent<HTMLDivElement>, idx: number) => {
    if (draggedIdx === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  };

  const handleItemDrop = (e: DragEvent<HTMLDivElement>, targetIdx: number) => {
    if (draggedIdx === null) return;
    e.preventDefault();

    if (draggedIdx !== targetIdx) {
      const reordered = [...images];
      const [moved] = reordered.splice(draggedIdx, 1);
      reordered.splice(targetIdx, 0, moved);
      onChange(reordered);
    }

    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleItemDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  // --- ตั้งเป็นรูปหลัก / ลบรูป ---
  const handleSetCover = (idx: number) => {
    if (idx === 0) return;
    const target = images[idx];
    onChange([target, ...images.filter((_, i) => i !== idx)]);
  };

  const handleRemoveImage = async (idx: number) => {
    const targetUrl = images[idx];
    onChange(images.filter((_, i) => i !== idx));

    if (sessionUploadedRef.current.has(targetUrl)) {
      sessionUploadedRef.current.delete(targetUrl);
      await deleteImage(targetUrl);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-wide text-zinc-700">
            Product Images ({totalCount}/{maxImages})
          </span>
          {images.length > 1 && (
            <p className="text-[11px] text-zinc-500">
              ลากรูปเพื่อจัดลำดับการแสดงผล (รูปแรกจะเป็นรูปหลักของสินค้า)
            </p>
          )}
        </div>
        {uploading && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            กำลังอัปโหลด {progress.done}/{progress.total} รูป...
          </span>
        )}
      </div>

      {/* โซนอัปโหลดไฟล์ */}
      <div
        onDragOver={handleFileDragOver}
        onDragLeave={() => setIsFileDragging(false)}
        onDrop={handleFileDrop}
        onClick={() => !uploading && totalCount < maxImages && fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${
          isFileDragging
            ? 'border-amber-500 bg-amber-50'
            : 'border-zinc-300 bg-white hover:border-amber-400 hover:bg-amber-50/40'
        } ${uploading || totalCount >= maxImages ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <Upload className="mb-1.5 h-5 w-5 text-amber-500" />
        <p className="text-xs font-semibold text-zinc-800">
          คลิกเพื่อเลือกรูป หรือลากไฟล์มาวางที่นี่ (เลือกได้หลายรูปพร้อมกัน)
        </p>
        <p className="mt-0.5 text-[11px] text-zinc-500">
          รองรับ JPG, PNG, WebP, AVIF ขนาดไม่เกิน 4 MB ต่อรูป
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          disabled={uploading || totalCount >= maxImages}
          className="hidden"
          onChange={async (e) => {
            if (e.target.files?.length) {
              await handleFilesSelected(e.target.files);
              e.target.value = '';
            }
          }}
        />
      </div>

      {/* ช่องเพิ่มรูปด้วย URL ตรง */}
      {allowUrlInput && (
        <div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (urlError) setUrlError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddImageUrl();
                  }
                }}
                placeholder="หรือวาง URL รูปภาพโดยตรง (ไม่อัปโหลดไฟล์) แล้วกด Add URL"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-xs text-zinc-900 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddImageUrl}
              disabled={!urlInput.trim() || totalCount >= maxImages}
              className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add URL
            </button>
          </div>
          {urlError && <p className="mt-1 text-xs text-rose-600">{urlError}</p>}
        </div>
      )}

      {/* Grid แสดงรูปสินค้า (ลากสลับลำดับได้) */}
      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white py-6 text-zinc-400">
          <ImageIcon className="mb-1 h-6 w-6" />
          <span className="text-xs">ยังไม่มีรูปสินค้า</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((url, idx) => {
            const isDraggingThis = draggedIdx === idx;
            const isDropTarget = dragOverIdx === idx && draggedIdx !== null && draggedIdx !== idx;

            return (
              <div
                key={`${url}-${idx}`}
                draggable={!uploading && deletingUrl !== url}
                onDragStart={(e) => handleItemDragStart(e, idx)}
                onDragOver={(e) => handleItemDragOver(e, idx)}
                onDragLeave={() => {
                  if (dragOverIdx === idx) setDragOverIdx(null);
                }}
                onDrop={(e) => handleItemDrop(e, idx)}
                onDragEnd={handleItemDragEnd}
                className={`group relative aspect-square cursor-grab overflow-hidden rounded-xl border bg-white transition active:cursor-grabbing ${
                  isDraggingThis
                    ? 'scale-95 border-amber-400 opacity-40'
                    : isDropTarget
                      ? 'scale-[1.03] border-amber-500 ring-2 ring-amber-500'
                      : idx === 0
                        ? 'border-amber-500 ring-2 ring-amber-500/20'
                        : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <img
                  src={url}
                  alt={`Product image ${idx + 1}`}
                  draggable={false}
                  className="pointer-events-none h-full w-full select-none object-cover"
                />

                {/* มุมซ้ายบน: ป้ายลำดับ / รูปหลัก */}
                <div className="absolute left-1.5 top-1.5 flex items-center gap-1">
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold shadow-sm ${
                      idx === 0
                        ? 'bg-amber-500 text-white'
                        : 'bg-zinc-900/75 text-white'
                    }`}
                  >
                    <GripVertical className="h-3 w-3" />
                    {idx === 0 ? 'รูปหลัก' : `#${idx + 1}`}
                  </span>
                </div>

                {/* มุมขวาบน: ตั้งเป็นรูปหลัก / ลบรูป */}
                <div className="absolute right-1.5 top-1.5 flex gap-1">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetCover(idx);
                      }}
                      title="ตั้งเป็นรูปหลัก"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-zinc-700 shadow-sm hover:bg-amber-500 hover:text-white"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={deletingUrl === url}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(idx);
                    }}
                    title="ลบรูปภาพ"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-rose-600 shadow-sm hover:bg-rose-600 hover:text-white disabled:opacity-50"
                  >
                    {deletingUrl === url ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Preview ชั่วคราวระหว่างอัปโหลด */}
          {pendingPreviews.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square overflow-hidden rounded-xl border border-amber-300 bg-white"
            >
              <img
                src={item.previewUrl}
                alt={item.name}
                className="h-full w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/35 text-white">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="mt-1 text-[10px] font-medium">กำลังอัปโหลด</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}