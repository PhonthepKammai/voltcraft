'use client';

import React, { useEffect, useState } from 'react';
import type { Address } from '@/types/voltcraft';
import { EMPTY_ADDRESS, sanitizeAddress, validateAddress } from '@/lib/address';
// import { inputCls, labelCls } from '@/components/ui/formStyles';

interface AddressFormModalProps {
  isOpen: boolean;
  initialData?: Address | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (address: Address) => Promise<void> | void;
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none mb-1 block text-xs font-medium text-slate-700';
const labelCls = 'mb-1 block text-xs font-medium text-slate-700';

/**
 * Wrapper: คืน null เมื่อปิด จึงทำให้ฟอร์มข้างในถูก unmount
 * และ state ถูกรีเซ็ตใหม่ทุกครั้งที่เปิด โดยไม่ต้องใช้ useEffect sync
 */
export default function AddressFormModal(props: AddressFormModalProps) {
  if (!props.isOpen) return null;
  return <AddressFormDialog {...props} />;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

function AddressFormDialog({
  initialData,
  saving = false,
  onClose,
  onSubmit,
}: AddressFormModalProps) {
  const [form, setForm] = useState<Address>(() =>
    initialData ? { ...EMPTY_ADDRESS, ...initialData } : EMPTY_ADDRESS
  );
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialData;
  const lockDefault = !!initialData?.isDefault;

  const requestClose = () => {
    if (!saving) onClose();
  };

  // ปิดด้วย ESC
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [saving, onClose]);

  const handleChange = (field: keyof Address, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeAddress(form);
    const message = validateAddress(clean);
    if (message) {
      setError(message);
      return;
    }
    await onSubmit(clean);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-modal-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 id="address-modal-title" className="text-lg font-bold text-slate-900">
            {isEditing ? 'แก้ไขที่อยู่จัดส่ง' : 'เพิ่มที่อยู่จัดส่งใหม่'}
          </h3>
          <button
            type="button"
            onClick={requestClose}
            disabled={saving}
            aria-label="ปิด"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="ป้ายกำกับที่อยู่">
              <input
                type="text"
                value={form.label || ''}
                onChange={(e) => handleChange('label', e.target.value)}
                placeholder="เช่น บ้าน, ที่ทำงาน"
                className={inputCls}
              />
            </Field>
            <Field label="ชื่อ-นามสกุลผู้รับ *">
              <input
                type="text"
                required
                value={form.recipient}
                onChange={(e) => handleChange('recipient', e.target.value)}
                placeholder="ชื่อผู้รับสินค้า"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="เบอร์โทรศัพท์ *">
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="08X-XXX-XXXX"
              className={inputCls}
            />
          </Field>

          <Field label="บ้านเลขที่ / อาคาร / ซอย / ถนน *">
            <textarea
              rows={2}
              required
              value={form.line1}
              onChange={(e) => handleChange('line1', e.target.value)}
              placeholder="เช่น 99/12 หมู่ 4 ถ.แจ้งวัฒนะ"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="แขวง / ตำบล">
              <input
                type="text"
                value={form.subdistrict || ''}
                onChange={(e) => handleChange('subdistrict', e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="เขต / อำเภอ">
              <input
                type="text"
                value={form.district || ''}
                onChange={(e) => handleChange('district', e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="จังหวัด *">
              <input
                type="text"
                required
                value={form.province}
                onChange={(e) => handleChange('province', e.target.value)}
                placeholder="เช่น นนทบุรี, กรุงเทพมหานคร"
                className={inputCls}
              />
            </Field>
            <Field label="รหัสไปรษณีย์ *">
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={5}
                value={form.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                placeholder="11120"
                className={inputCls}
              />
            </Field>
          </div>

          <div>
            <label
              className={`flex items-center gap-2 pt-1 text-sm text-slate-700 ${
                lockDefault ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                checked={Boolean(form.isDefault)}
                disabled={lockDefault}
                onChange={(e) => handleChange('isDefault', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              ตั้งเป็นที่อยู่จัดส่งหลัก (Default)
            </label>
            {lockDefault && (
              <p className="mt-1 text-xs text-slate-500">
                นี่คือที่อยู่หลักอยู่แล้ว หากต้องการเปลี่ยน ให้กด "ตั้งเป็นหลัก" ที่ที่อยู่อื่น
              </p>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={requestClose}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกที่อยู่'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}