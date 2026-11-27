'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Address, User } from '@/types/voltcraft';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/apiClient';
import { normalizeAddresses } from '@/lib/address';

export interface ProfileFormValues {
  name: string;
  phone: string;
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
  addresses?: Address[];
}

interface UseProfileOptions {
  onProfileUpdated?: (user: User) => void;
  onNotify?: (message: string, type?: 'success' | 'error') => void;
}

type RawProfileUser = Partial<User> & {
  _id?: string;
  roles?: string[];
};

const PROFILE_ENDPOINT = '/api/profile';

const errMsg = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

/** แปลง response จาก profile.service (_id, roles) ให้มี id และ role ตรงกับ AuthContext */
const normalizeUser = (raw: RawProfileUser): User => {
  const roles = raw.roles ?? ['customer'];
  return {
    ...raw,
    id: raw._id ?? (raw._id ? String(raw._id) : ''),
    role: raw.role ?? (roles.includes('admin') ? 'admin' : 'customer'),
    roles,
    addresses: raw.addresses ?? [],
  } as User;
};

export function useProfile({ onProfileUpdated, onNotify }: UseProfileOptions = {}) {
  const { user: authUser, updateUser } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<User | null>(authUser);
  const [loading, setLoading] = useState(!!authUser);
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const isLoggedIn = !!authUser;

  const notify = useCallback(
    (msg: string, type: 'success' | 'error' = 'success') => {
      if (onNotify) onNotify(msg, type);
      else showToast(msg, type);
    },
    [onNotify, showToast]
  );

  // โหลดโปรไฟล์ล่าสุดจาก API Route (เฉพาะตอนล็อกอินแล้ว)
  useEffect(() => {
    if (!isLoggedIn) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { user: raw } = await api<{ user: RawProfileUser }>(PROFILE_ENDPOINT, {
          credentials: 'include',
        });
        if (cancelled) return;
        const user = normalizeUser(raw);
        setProfile(user);
        updateUser(user);
      } catch (err) {
        if (!cancelled) notify(errMsg(err, 'โหลดโปรไฟล์ไม่สำเร็จ'), 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, notify, updateUser]);

  const persist = useCallback(
    async (payload: UpdateProfilePayload, successMsg: string) => {
      const { user: raw } = await api<{ user: RawProfileUser }>(PROFILE_ENDPOINT, {
        method: 'PATCH',
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const updated = normalizeUser(raw);
      setProfile(updated);
      updateUser(updated);
      onProfileUpdated?.(updated);
      notify(successMsg, 'success');
      return updated;
    },
    [updateUser, onProfileUpdated, notify]
  );

  // ---- ข้อมูลส่วนตัว ----
  const saveInfo = async (values: ProfileFormValues): Promise<boolean> => {
    const payload: UpdateProfilePayload = {
      name: values.name.trim(),
      phone: values.phone.trim(),
    };

    if (values.newPassword) {
      if (!values.currentPassword) {
        notify('กรุณากรอกรหัสผ่านปัจจุบันก่อนตั้งรหัสผ่านใหม่', 'error');
        return false;
      }
      if (values.newPassword.length < 8) {
        notify('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร', 'error');
        return false;
      }
      payload.currentPassword = values.currentPassword;
      payload.newPassword = values.newPassword;
    }

    try {
      setSavingInfo(true);
      await persist(payload, 'บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว');
      return true;
    } catch (err) {
      notify(errMsg(err, 'เกิดข้อผิดพลาด'), 'error');
      return false;
    } finally {
      setSavingInfo(false);
    }
  };

  // ---- ที่อยู่ ----
  const saveAddress = async (
    form: Address,
    editingIndex: number | null
  ): Promise<boolean> => {
    if (!profile) return false;
    try {
      setSavingAddress(true);
      const current = [...(profile.addresses ?? [])];
      let next: Address[];
      let preferredDefault: number | undefined;

      if (editingIndex !== null) {
        current[editingIndex] = form;
        next = current;
        if (form.isDefault) preferredDefault = editingIndex;
      } else {
        next = [...current, form];
        if (form.isDefault || current.length === 0) preferredDefault = next.length - 1;
      }

      await persist(
        { addresses: normalizeAddresses(next, preferredDefault) },
        editingIndex !== null ? 'แก้ไขที่อยู่เรียบร้อยแล้ว' : 'เพิ่มที่อยู่ใหม่เรียบร้อยแล้ว'
      );
      return true;
    } catch (err) {
      notify(errMsg(err, 'บันทึกที่อยู่ไม่สำเร็จ'), 'error');
      return false;
    } finally {
      setSavingAddress(false);
    }
  };

  const setDefaultAddress = async (index: number) => {
    if (!profile) return;
    try {
      setSavingAddress(true);
      await persist(
        { addresses: normalizeAddresses(profile.addresses ?? [], index) },
        'เปลี่ยนที่อยู่จัดส่งหลักเรียบร้อยแล้ว'
      );
    } catch (err) {
      notify(errMsg(err, 'เกิดข้อผิดพลาด'), 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  const deleteAddress = async (index: number) => {
    if (!profile) return;
    try {
      setSavingAddress(true);
      const remaining = (profile.addresses ?? []).filter((_, i) => i !== index);
      await persist({ addresses: normalizeAddresses(remaining) }, 'ลบที่อยู่เรียบร้อยแล้ว');
    } catch (err) {
      notify(errMsg(err, 'ลบที่อยู่ไม่สำเร็จ'), 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  return {
    profile,
    loading,
    savingInfo,
    savingAddress,
    saveInfo,
    saveAddress,
    setDefaultAddress,
    deleteAddress,
  };
}