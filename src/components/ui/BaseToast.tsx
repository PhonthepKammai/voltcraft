'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastItem } from '@/types/voltcraft';

interface BaseToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function BaseToast({ toast, onDismiss }: BaseToastProps) {
  const styles = {
    success: {
      border: 'border-emerald-200',
      icon: <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />,
    },
    error: {
      border: 'border-rose-200',
      icon: <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />,
    },
    info: {
      border: 'border-amber-200',
      icon: <Info className="h-5 w-5 shrink-0 text-amber-600" />,
    },
  }[toast.type];

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white p-3.5 shadow-lg ${styles.border}`}
    >
      {styles.icon}
      <p className="flex-1 text-sm font-medium text-zinc-800">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}