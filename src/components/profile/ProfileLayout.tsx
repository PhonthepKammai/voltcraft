'use client';

import React from 'react';
import type { User } from '@/types/voltcraft';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import ProfileView from './ProfileView';

interface ProfileLayoutProps {
  onBack?: () => void;
  onProfileUpdated?: (user: User) => void;
  onNotify?: (message: string, type?: 'success' | 'error') => void;
}

export function ProfileLayout({ onBack, onProfileUpdated, onNotify }: ProfileLayoutProps) {
  const { navigateTo } = useAuth();
  const {
    profile,
    loading,
    savingInfo,
    savingAddress,
    saveInfo,
    saveAddress,
    setDefaultAddress,
    deleteAddress,
  } = useProfile({ onProfileUpdated, onNotify });

  const handleBack = () => (onBack ? onBack() : navigateTo('storefront'));

  let content: React.ReactNode;

  if (loading) {
    content = (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center text-slate-500">
        กำลังโหลดข้อมูลโปรไฟล์...
      </div>
    );
  } else if (!profile) {
    content = (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <p className="text-slate-600">กรุณาเข้าสู่ระบบเพื่อจัดการโปรไฟล์ของคุณ</p>
        <button
          type="button"
          onClick={() => navigateTo('auth')}
          className="mt-4 rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          ไปหน้าเข้าสู่ระบบ
        </button>
      </div>
    );
  } else {
    content = (
      <ProfileView
        profile={profile}
        savingInfo={savingInfo}
        savingAddress={savingAddress}
        onBack={handleBack}
        onSaveInfo={saveInfo}
        onSaveAddress={saveAddress}
        onSetDefaultAddress={setDefaultAddress}
        onDeleteAddress={deleteAddress}
      />
    );
  }

  return <div className="min-h-screen bg-zinc-50">{content}</div>;
}