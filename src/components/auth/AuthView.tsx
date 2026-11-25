'use client';

import React, { useState } from 'react';
import { ArrowLeft, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';

export function AuthView() {
  const { navigateTo } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => navigateTo('storefront')}
          className="mb-4 inline-flex h-10 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-200/60 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Storefront</span>
        </button>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
              <Zap className="h-6 w-6 fill-current" />
            </span>
            <h1 className="mt-3 text-xl font-bold text-zinc-900">
              {mode === 'login' ? 'Sign in to VoltCraft' : 'Create your VoltCraft account'}
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              {mode === 'login'
                ? 'Manage orders, warranties, or access the Admin Back-Office.'
                : 'Fast THB checkout and warranty tracking across Thailand.'}
            </p>
          </div>

          {mode === 'login' ? (
            <LoginForm onSwitchToRegister={() => setMode('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setMode('login')} />
          )}
        </div>
      </div>
    </div>
  );
}