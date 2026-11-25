'use client';

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthForm } from '@/hooks/useAuthForm';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const {
    regName,
    setRegName,
    regEmail,
    setRegEmail,
    regPhone,
    setRegPhone,
    regPassword,
    setRegPassword,
    regConfirmPassword,
    setRegConfirmPassword,
    showRegPassword,
    toggleRegPassword,
    handleRegisterSubmit,
    isSubmitting,
  } = useAuthForm();

  return (
    <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-700">
          Full Name
        </label>
        <input
          type="text"
          required
          value={regName}
          onChange={(e) => setRegName(e.target.value)}
          placeholder="Nattapong Srisuk"
          className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-700">
          Email Address
        </label>
        <input
          type="email"
          required
          value={regEmail}
          onChange={(e) => setRegEmail(e.target.value)}
          placeholder="name@example.com"
          className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-700">
          Phone Number (TH)
        </label>
        <input
          type="tel"
          required
          value={regPhone}
          onChange={(e) => setRegPhone(e.target.value)}
          placeholder="08X-XXX-XXXX"
          className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-700">
          Password
        </label>
        <div className="relative">
          <input
            type={showRegPassword ? 'text' : 'password'}
            required
            value={regPassword}
            onChange={(e) => setRegPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-3.5 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
          />
          <button
            type="button"
            onClick={toggleRegPassword}
            aria-label={showRegPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200/70 hover:text-zinc-700"
          >
            {showRegPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-zinc-700">
          Confirm Password
        </label>
        <input
          type={showRegPassword ? 'text' : 'password'}
          required
          value={regConfirmPassword}
          onChange={(e) => setRegConfirmPassword(e.target.value)}
          placeholder="Re-enter password"
          className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full rounded-xl bg-amber-500 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-60"
      >
        {isSubmitting ? 'Creating Account...' : 'Create Account'}
      </button>

      <p className="pt-1 text-center text-sm text-zinc-600">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-amber-600 hover:underline"
        >
          Sign In
        </button>
      </p>
    </form>
  );
}