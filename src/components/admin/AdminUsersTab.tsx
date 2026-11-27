'use client';

import React, { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAdminUsers, type AdminUserItem } from '@/hooks/useAdminUsers';

interface AdminUsersTabProps {
  currentUserId?: string;
}

export default function AdminUsersTab({ currentUserId }: AdminUsersTabProps) {
  const { user: authUser } = useAuth();
  const { users, loading, updatingId, fetchUsers, toggleUserStatus } = useAdminUsers();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const effectiveCurrentUserId = currentUserId ?? authUser?._id;

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      const matchSearch =
        !keyword ||
        u.name.toLowerCase().includes(keyword) ||
        u.email.toLowerCase().includes(keyword) ||
        (u.phone || '').toLowerCase().includes(keyword);
      return matchRole && matchStatus && matchSearch;
    });
  }, [users, search, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const customers = total - admins;
    const suspended = users.filter((u) => u.status === 'suspended').length;
    return { total, admins, customers, suspended };
  }, [users]);

  const handleToggleStatus = async (user: AdminUserItem) => {
    if (user.id === effectiveCurrentUserId) return;

    if (user.status === 'active') {
      const confirmed = window.confirm(
        `ยืนยันการระงับบัญชีผู้ใช้ "${user.name}" (${user.email})?`
      );
      if (!confirmed) return;
    }

    await toggleUserStatus(user);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">จัดการผู้ใช้งาน (Users)</h2>
          <p className="text-sm text-slate-500">
            ตรวจสอบบัญชีผู้ใช้งาน ระงับหรือเปิดใช้งานบัญชี และดูข้อมูลที่อยู่จัดส่ง
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchUsers()}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {loading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล'}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">ผู้ใช้ทั้งหมด</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">ลูกค้า (Customer)</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{stats.customers}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">ผู้ดูแลระบบ (Admin)</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{stats.admins}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">ถูกระงับ (Suspended)</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{stats.suspended}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อ, อีเมล หรือเบอร์โทร..."
          className="w-full flex-1 rounded-lg text-slate-700 border border-slate-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <div className="flex flex-wrap gap-2">
          {(['all', 'customer', 'admin'] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm ${
                roleFilter === role
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {role === 'all' ? 'ทุกสิทธิ์' : role === 'admin' ? 'Admin' : 'Customer'}
            </button>
          ))}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | 'active' | 'suspended')
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none sm:text-sm"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="active">ใช้งานปกติ (Active)</option>
            <option value="suspended">ถูกระงับ (Suspended)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">ผู้ใช้งาน</th>
                <th className="px-4 py-3">เบอร์โทร</th>
                <th className="px-4 py-3">สิทธิ์</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">ที่อยู่</th>
                <th className="px-4 py-3">วันที่สมัคร</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    กำลังโหลดข้อมูลผู้ใช้งาน...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSelf =
                    user.id === effectiveCurrentUserId || user._id === effectiveCurrentUserId;
                  const isBusy = updatingId === user.id;
                  const isActive = user.status === 'active';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {user.name}
                              {isSelf && (
                                <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700">
                                  คุณ
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{user.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            user.role === 'admin'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {user.role === 'admin' ? 'Admin' : 'Customer'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          {isActive ? 'ใช้งานปกติ' : 'ถูกระงับ'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {user.addresses?.length ?? user.addressCount ?? 0} รายการ
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('th-TH')
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedUserId(user.id)}
                            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            รายละเอียด
                          </button>
                          <button
                            type="button"
                            disabled={isSelf || isBusy}
                            onClick={() => handleToggleStatus(user)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                              isActive
                                ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {isBusy
                              ? 'กำลังบันทึก...'
                              : isActive
                                ? 'ระงับบัญชี'
                                : 'เปิดใช้งาน'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedUser.name}</h3>
                <p className="text-sm text-slate-500">{selectedUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                <div>
                  <span className="text-xs text-slate-500">สิทธิ์การใช้งาน</span>
                  <p className="font-semibold capitalize text-slate-900">{selectedUser.role}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">สถานะบัญชี</span>
                  <p
                    className={`font-semibold ${
                      selectedUser.status === 'active' ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {selectedUser.status === 'active' ? 'ใช้งานปกติ' : 'ถูกระงับ'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">เบอร์โทรศัพท์</span>
                  <p className="font-semibold text-slate-900">{selectedUser.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">เข้าใช้งานล่าสุด</span>
                  <p className="font-semibold text-slate-900">
                    {selectedUser.lastLoginAt
                      ? new Date(selectedUser.lastLoginAt).toLocaleString('th-TH')
                      : '-'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-800">
                  ที่อยู่จัดส่งที่บันทึกไว้ ({selectedUser.addresses?.length ?? 0})
                </h4>
                {!selectedUser.addresses || selectedUser.addresses.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
                    ยังไม่มีข้อมูลที่อยู่
                  </p>
                ) : (
                  <div className="max-h-60 space-y-2.5 overflow-y-auto pr-1">
                    {selectedUser.addresses.map((addr, index) => (
                      <div
                        key={addr._id || index}
                        className="rounded-xl border border-slate-200 p-3 text-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900">
                            {addr.label || `ที่อยู่ #${index + 1}`} — {addr.recipient}
                          </span>
                          {addr.isDefault && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                              ค่าเริ่มต้น
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-slate-600">
                          {addr.line1} {addr.subdistrict} {addr.district} {addr.province}{' '}
                          {addr.postalCode}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">โทร: {addr.phone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-2">
              {selectedUser.id !== effectiveCurrentUserId ? (
                <button
                  type="button"
                  disabled={updatingId === selectedUser.id}
                  onClick={() => handleToggleStatus(selectedUser)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50 ${
                    selectedUser.status === 'active'
                      ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {updatingId === selectedUser.id
                    ? 'กำลังบันทึก...'
                    : selectedUser.status === 'active'
                      ? 'ระงับบัญชีนี้'
                      : 'เปิดใช้งานบัญชีนี้'}
                </button>
              ) : (
                <span />
              )}

              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}