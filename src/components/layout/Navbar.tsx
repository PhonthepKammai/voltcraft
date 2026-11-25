'use client';

import React, { useState } from 'react';
import {
  Zap,
  ShoppingCart,
  Search,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  ChevronDown,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { SearchBar } from '@/components/layout/SearchBar';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function Navbar({ searchQuery, onSearchChange }: NavbarProps) {
  const { user, isAuthenticated, navigateTo, logout } = useAuth();
  const { cart, setIsCartOpen } = useStore();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={() => navigateTo('storefront')}
          className="flex shrink-0 items-center gap-2.5 text-left"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
            <Zap className="h-5 w-5 fill-current" />
          </span>
          <div>
            <span className="block text-lg font-bold tracking-tight text-zinc-900">
              VoltCraft
            </span>
            <span className="hidden text-[11px] font-medium text-zinc-400 sm:block">
              Electrical Appliances TH
            </span>
          </div>
        </button>

        {/* Desktop Search */}
        <div className="hidden flex-1 max-w-md md:block">
          <SearchBar value={searchQuery} onChange={onSearchChange} />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Toggle */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            aria-label="Toggle search"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 md:hidden"
          >
            {mobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>

          {/* Cart Button */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label="Open shopping cart"
            className="relative flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-semibold text-zinc-800 transition hover:border-amber-300 hover:bg-amber-50"
          >
            <ShoppingCart className="h-5 w-5 text-zinc-700" />
            <span className="hidden sm:inline">Cart</span>
            {cart.itemCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                {cart.itemCount}
              </span>
            )}
          </button>

          {/* Auth / User Menu */}
          {!isAuthenticated ? (
            <button
              type="button"
              onClick={() => navigateTo('auth')}
              className="flex h-11 items-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
            >
              <UserIcon className="h-4 w-4" />
              <span>Login</span>
            </button>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-[120px] truncate sm:inline">
                  {user?.name}
                </span>
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-60 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
                    <div className="border-b border-zinc-100 px-3 py-2.5">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {user?.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500">{user?.email}</p>
                    </div>

                    {user?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          navigateTo('admin');
                        }}
                        className="mt-1 flex h-11 w-full items-center gap-2.5 rounded-xl bg-amber-50 px-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Admin Back-Office</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="mt-1 flex h-11 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expandable Mobile Search Bar */}
      {mobileSearchOpen && (
        <div className="border-t border-zinc-100 bg-white px-4 py-3 md:hidden">
          <SearchBar value={searchQuery} onChange={onSearchChange} />
        </div>
      )}
    </header>
  );
}