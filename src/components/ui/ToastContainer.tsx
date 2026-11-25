'use client';

import React from 'react';
import { useToast } from '@/context/ToastContext';
import { BaseToast } from '@/components/ui/BaseToast';

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-4 sm:translate-x-0">
      {toasts.map((toast) => (
        <BaseToast key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}