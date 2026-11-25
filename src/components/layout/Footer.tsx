'use client';

import React from 'react';
import { Zap, ShieldCheck, Truck, Headphones } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-6 border-b border-zinc-100 pb-8 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Free Delivery Nationwide
              </h3>
              <p className="text-xs text-zinc-600">
                Complimentary shipping on appliance orders over ฿10,000.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                100% Official Thai Warranty
              </h3>
              <p className="text-xs text-zinc-600">
                Authorized dealer for Mitsubishi Electric, Samsung, LG, Panasonic & Sharp.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Headphones className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Appliance Specialists
              </h3>
              <p className="text-xs text-zinc-600">
                Support daily 09:00–20:00 (ICT) • Pak Kret, Nonthaburi.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white">
              <Zap className="h-4 w-4 fill-current" />
            </span>
            <span className="text-sm font-bold text-zinc-900">VoltCraft</span>
          </div>
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} VoltCraft Co., Ltd. All prices in Thai Baht (THB).
          </p>
        </div>
      </div>
    </footer>
  );
}