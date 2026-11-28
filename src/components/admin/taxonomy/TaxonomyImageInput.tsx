'use client';

import React, { useRef, useState } from 'react';
import { ImageIcon, Link2, Loader2, Upload, X } from 'lucide-react';
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

export function TaxonomyImageInput({
  label,
  required = false,
  scope,
  value,
  onChange,
  onUploadingChange,
  previewClassName = 'h-12 w-12',
  placeholder = 'วาง URL รูปภาพ หรือกด Upload...',
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

      <div className="flex items-center gap-2.5">
        <div
          className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white ${previewClassName}`}
        >
          {displaySrc ? (
            <>
              <img
                src={displaySrc}
                alt={label}
                className={`h-full w-full object-contain p-1 ${localPreview ? 'opacity-50' : ''}`}
              />
              {localPreview ? (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/20">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                </div>
              ) : (
                <button
                  type="button"
                  disabled={deletingUrl === value}
                  onClick={handleClear}
                  aria-label={`Clear ${label}`}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-md bg-white/95 text-rose-600 shadow-xs hover:bg-rose-600 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </>
          ) : (
            <ImageIcon className="h-4 w-4 text-zinc-300" />
          )}
        </div>

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
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none disabled:opacity-60"
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
            <span>{uploading ? 'กำลังอัปโหลด' : 'Upload'}</span>
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