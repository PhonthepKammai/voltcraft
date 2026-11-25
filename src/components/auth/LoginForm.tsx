'use client';

import React from 'react';
import { Eye, EyeOff, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAuthForm } from '@/hooks/useAuthForm';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const {
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    showLoginPassword,
    toggleLoginPassword,
    fillDemoAccount,
    handleLoginSubmit,
    isSubmitting,
  } = useAuthForm();

  return (
    <form onSubmit={handleLoginSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-zinc-700">
          Email Address
        </label>
        <input
          type="email"
          required
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          placeholder="you@voltcraft.com"
          className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-zinc-700">
          Password
        </label>
        <div className="relative">
          <input
            type={showLoginPassword ? 'text' : 'password'}
            required
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder="••••••••"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-3.5 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
          />
          <button
            type="button"
            onClick={toggleLoginPassword}
            aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200/70 hover:text-zinc-700"
          >
            {showLoginPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full rounded-xl bg-amber-500 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-60"
      >
        {isSubmitting ? 'Signing In...' : 'Sign In'}
      </button>

      {/* Demo Quick-Fill Buttons */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
        <p className="mb-2 text-center text-xs font-semibold text-zinc-500">
          Quick Demo Credentials
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillDemoAccount('customer')}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-800 transition hover:border-amber-300 hover:bg-amber-50"
          >
            <UserIcon className="h-3.5 w-3.5 text-amber-600" />
            <span>Customer</span>
          </button>
          <button
            type="button"
            onClick={() => fillDemoAccount('admin')}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admin</span>
          </button>
        </div>
      </div>

      <p className="pt-1 text-center text-sm text-zinc-600">
        New to VoltCraft?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-semibold text-amber-600 hover:underline"
        >
          Create an account
        </button>
      </p>
    </form>
  );
}