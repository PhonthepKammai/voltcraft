'use client';

import React, { createContext, useContext } from 'react';
import { ToastItem, ToastType } from '@/types/voltcraft';
import { useToastState } from '@/hooks/useToast';

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toastState = useToastState();
  return <ToastContext.Provider value={toastState}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}