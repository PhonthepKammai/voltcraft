'use client';

import React, { useEffect, useState } from 'react';
import type { Address, User } from '@/types/voltcraft';
import type { ProfileFormValues } from '@/hooks/useProfile';
import AddressFormModal from './AddressFormModal';

interface ProfileViewProps {
  profile: User;
  savingInfo: boolean;
  savingAddress: boolean;
  onBack: () => void;
  onSaveInfo: (values: ProfileFormValues) => Promise<boolean>;
  onSaveAddress: (address: Address, editingIndex: number | null) => Promise<boolean>;
  onSetDefaultAddress: (index: number) => void;
  onDeleteAddress: (index: number) => void;
}

const inputCls =
  'w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none mb-1 block text-xs font-medium text-slate-700';
const labelCls = 'mb-1 block text-xs font-medium text-slate-700';
const outlineBtn =
  'rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50';

export default function ProfileView({
  profile,
  savingInfo,
  savingAddress,
  onBack,
  onSaveInfo,
  onSaveAddress,
  onSetDefaultAddress,
  onDeleteAddress,
}: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'addresses'>('info');

  // ฟอร์มข้อมูลส่วนตัว
  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // modal ที่อยู่
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // sync ฟอร์มเมื่อ profile เปลี่ยน (เช่น โหลดจาก server เสร็จ)
  useEffect(() => {
    setName(profile.name || '');
    setPhone(profile.phone || '');
  }, [profile.name, profile.phone]);

  const addresses = profile.addresses ?? [];

  const openAddressModal = (index: number | null) => {
    setEditingIndex(index);
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setIsAddressModalOpen(false);
    setEditingIndex(null);
  };

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onSaveInfo({ name, phone, currentPassword, newPassword });
    if (ok) {
      setCurrentPassword('');
      setNewPassword('');
    }
  };

  const handleSubmitAddress = async (form: Address) => {
    const ok = await onSaveAddress(form, editingIndex);
    if (ok) closeAddressModal();
  };

  const handleDelete = (index: number) => {
    if (window.confirm('ยืนยันการลบที่อยู่นี้?')) onDeleteAddress(index);
  };

  const tabCls = (tab: 'info' | 'addresses') =>
    `border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
      activeTab === tab
        ? 'border-slate-900 text-slate-900'
        : 'border-transparent text-slate-500 hover:text-slate-800'
    }`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">บัญชีของฉัน</h1>
          <p className="text-sm text-slate-500">
            จัดการข้อมูลส่วนตัวและที่อยู่สำหรับการจัดส่งสินค้า
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="self-start rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:self-auto"
        >
          ← กลับหน้าร้านค้า
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-slate-200">
        <button type="button" onClick={() => setActiveTab('info')} className={tabCls('info')}>
          ข้อมูลส่วนตัว
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('addresses')}
          className={tabCls('addresses')}
        >
          สมุดที่อยู่ ({addresses.length})
        </button>
      </div>

      {/* Tab 1: ข้อมูลส่วนตัว */}
      {activeTab === 'info' && (
        <form
          onSubmit={handleSubmitInfo}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
        >
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-xl font-bold text-white">
              {profile.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">{profile.name}</h2>
              <p className="text-sm text-slate-500">{profile.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>ชื่อ-นามสกุล *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>อีเมล</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-500"
              />
            </div>
            <div>
              <label className={labelCls}>เบอร์โทรศัพท์</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08X-XXX-XXXX"
                className={inputCls}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">
              เปลี่ยนรหัสผ่าน (เว้นว่างหากไม่ต้องการเปลี่ยน)
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>รหัสผ่านปัจจุบัน</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>รหัสผ่านใหม่</label>
                <input
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingInfo}
              className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {savingInfo ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: ที่อยู่ */}
      {activeTab === 'addresses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">ที่อยู่จัดส่งทั้งหมด</h2>
            <button
              type="button"
              onClick={() => openAddressModal(null)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              + เพิ่มที่อยู่ใหม่
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
              <p className="text-sm text-slate-500">คุณยังไม่ได้บันทึกที่อยู่จัดส่ง</p>
              <button
                type="button"
                onClick={() => openAddressModal(null)}
                className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                เพิ่มที่อยู่แรกของคุณ
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {addresses.map((addr, index) => (
                <div
                  key={addr._id || index}
                  className={`flex flex-col justify-between rounded-2xl border bg-white p-5 ${
                    addr.isDefault ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {addr.label || `ที่อยู่ #${index + 1}`}
                      </span>
                      {addr.isDefault && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          ค่าเริ่มต้น
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-800">{addr.recipient}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {addr.line1} {addr.subdistrict} {addr.district} {addr.province}{' '}
                      {addr.postalCode}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">โทร: {addr.phone}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                    {!addr.isDefault && (
                      <button
                        type="button"
                        disabled={savingAddress}
                        onClick={() => onSetDefaultAddress(index)}
                        className={outlineBtn}
                      >
                        ตั้งเป็นหลัก
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={savingAddress}
                      onClick={() => openAddressModal(index)}
                      className={outlineBtn}
                    >
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      disabled={savingAddress}
                      onClick={() => handleDelete(index)}
                      className="ml-auto rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AddressFormModal
        isOpen={isAddressModalOpen}
        initialData={editingIndex !== null ? addresses[editingIndex] ?? null : null}
        saving={savingAddress}
        onClose={closeAddressModal}
        onSubmit={handleSubmitAddress}
      />
    </div>
  );
}