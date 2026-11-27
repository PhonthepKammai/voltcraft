'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Layers,
  MessageSquare,
  Zap,
  User,
} from 'lucide-react';
import { AdminTab } from '@/types/voltcraft';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { AdminOverviewTab } from '@/components/admin/AdminOverviewTab';
import { AdminProductsTab } from '@/components/admin/AdminProductsTab';
import { AdminOrdersTab } from '@/components/admin/AdminOrdersTab';
import { AdminTaxonomyTab } from '@/components/admin/AdminTaxonomyTab';
import { AdminReviewsTab } from '@/components/admin/AdminReviewsTab';
import AdminUsersTab from './AdminUsersTab';

const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'users', label: 'Users', icon: <User className="h-4 w-4" /> },
  { id: 'products', label: 'Products', icon: <Package className="h-4 w-4" /> },
  { id: 'orders', label: 'Orders', icon: <ShoppingBag className="h-4 w-4" /> },
  { id: 'taxonomy', label: 'Categories & Brands', icon: <Layers className="h-4 w-4" /> },
  { id: 'reviews', label: 'Reviews', icon: <MessageSquare className="h-4 w-4" /> },
];

export function AdminLayout() {
  const { user, navigateTo } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Strict Role Guard
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      showToast('Access denied. Administrator privileges required.', 'error');
      navigateTo('storefront');
    }
  }, [user, navigateTo, showToast]);

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Zap className="h-5 w-5 fill-current" />
            </span>
            <div>
              <span className="block text-sm font-bold text-zinc-900">
                VoltCraft Back-Office
              </span>
              <span className="block text-[11px] text-zinc-400">
                Admin Console • THB
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigateTo('storefront')}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-semibold text-zinc-800 transition hover:border-amber-300 hover:bg-amber-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Storefront</span>
          </button>
        </div>

        {/* Mobile Horizontal Tab Bar */}
        <nav className="flex gap-1.5 overflow-x-auto border-t border-zinc-100 px-4 py-2.5 lg:hidden">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-semibold transition ${
                  active
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-amber-50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Layout Shell */}
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        {/* Desktop Sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1.5 rounded-2xl border border-zinc-200 bg-white p-3">
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition ${
                    active
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <span className={active ? 'text-amber-600' : 'text-zinc-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Active Panel */}
        <main className="min-w-0 flex-1">
          {activeTab === 'overview' && <AdminOverviewTab />}
          {activeTab === 'users' && <AdminUsersTab />}
          {activeTab === 'products' && <AdminProductsTab />}
          {activeTab === 'orders' && <AdminOrdersTab />}
          {activeTab === 'taxonomy' && <AdminTaxonomyTab />}
          {activeTab === 'reviews' && <AdminReviewsTab />}
        </main>
      </div>
    </div>
  );
}