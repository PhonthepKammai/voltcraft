'use client';

import React from 'react';
import { ArrowRight, Sparkles, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface HeroBannerProps {
  onExploreClick: () => void;
}

export function HeroBanner({ onExploreClick }: HeroBannerProps) {
  const { isAuthenticated, navigateTo } = useAuth();

  return (
    <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8">
      <div className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-stone-50 p-6 sm:p-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100/80 px-3 py-1 text-xs font-semibold text-amber-700">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Inverter Energy-Saver Deals • Save up to 20%</span>
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Upgrade Your Home with Smart, Efficient Appliances.
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base">
            Genuine Thailand warranty on Air Conditioners, Refrigerators, OLED Smart TVs,
            Washing Machines, and Kitchen essentials—with fast delivery and transparent
            THB pricing.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onExploreClick}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
            >
              <span>Shop Appliances</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => navigateTo('auth')}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-800 transition hover:border-amber-300 hover:bg-amber-50"
              >
                <UserPlus className="h-4 w-4 text-amber-600" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}