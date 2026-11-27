'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { Address } from '@/types/voltcraft';

export type AdminUserStatus = 'active' | 'suspended';

export interface AdminUserItem {
  id: string;
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'customer';
  roles: string[];
  status: AdminUserStatus;
  addresses: Address[];
  addressCount: number;
  lastLoginAt: string | null;
  createdAt: string | null;
}

export interface AdminUsersFilter {
  search?: string;
  role?: '' | 'admin' | 'customer';
  status?: '' | AdminUserStatus;
}

const USERS_ENDPOINT = '/api/users';

const errMsg = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

export function useAdminUsers(initialFilter: AdminUsersFilter = {}) {
  const { showToast } = useToast();

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (filter: AdminUsersFilter = {}) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filter.search?.trim()) params.set('search', filter.search.trim());
        if (filter.role) params.set('role', filter.role);
        if (filter.status) params.set('status', filter.status);

        const qs = params.toString();
        const url = qs ? `${USERS_ENDPOINT}?${qs}` : USERS_ENDPOINT;

        const { users: data } = await api<{ users: AdminUserItem[] }>(url, {
          credentials: 'include',
        });
        setUsers(data);
      } catch (err) {
        showToast(errMsg(err, 'โหลดรายชื่อผู้ใช้งานไม่สำเร็จ'), 'error');
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchUsers(initialFilter);
    // โหลดครั้งแรกเมื่อเปิดหน้าตาราง
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateUserStatus = useCallback(
    async (userId: string, status: AdminUserStatus): Promise<boolean> => {
      try {
        setUpdatingId(userId);
        const { user: updated } = await api<{ user: AdminUserItem }>(USERS_ENDPOINT, {
          method: 'PATCH',
          credentials: 'include',
          body: JSON.stringify({ userId, status }),
        });

        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        showToast(
          status === 'suspended'
            ? `ระงับบัญชี ${updated.name} เรียบร้อยแล้ว`
            : `เปิดใช้งานบัญชี ${updated.name} เรียบร้อยแล้ว`,
          'success'
        );
        return true;
      } catch (err) {
        showToast(errMsg(err, 'อัปเดตสถานะผู้ใช้งานไม่สำเร็จ'), 'error');
        return false;
      } finally {
        setUpdatingId(null);
      }
    },
    [showToast]
  );

  const toggleUserStatus = useCallback(
    (user: Pick<AdminUserItem, 'id' | 'status'>) => {
      const nextStatus: AdminUserStatus =
        user.status === 'active' ? 'suspended' : 'active';
      return updateUserStatus(user.id, nextStatus);
    },
    [updateUserStatus]
  );

  return {
    users,
    loading,
    updatingId,
    fetchUsers,
    updateUserStatus,
    toggleUserStatus,
  };
}