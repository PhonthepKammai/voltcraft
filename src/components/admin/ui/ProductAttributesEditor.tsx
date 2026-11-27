'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export interface AttributeRow {
  key: string;
  value: string;
}

interface ProductAttributesEditorProps {
  rows: AttributeRow[];
  onChange: (rows: AttributeRow[]) => void;
}

export function ProductAttributesEditor({
  rows,
  onChange,
}: ProductAttributesEditorProps) {
  const handleAdd = () => {
    onChange([...rows, { key: '', value: '' }]);
  };

  const handleUpdate = (idx: number, field: 'key' | 'value', val: string) => {
    onChange(rows.map((row, i) => (i === idx ? { ...row, [field]: val } : row)));
  };

  const handleRemove = (idx: number) => {
    onChange(rows.filter((_, i) => i !== idx));
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-zinc-700">
          Specification Attributes
        </span>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-200"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Row</span>
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              type="text"
              value={row.key}
              onChange={(e) => handleUpdate(idx, 'key', e.target.value)}
              placeholder="Key (e.g. กำลังไฟ)"
              className="h-10 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus:border-amber-500 focus:outline-none"
            />
            <input
              type="text"
              value={row.value}
              onChange={(e) => handleUpdate(idx, 'value', e.target.value)}
              placeholder="Value (e.g. 1500W)"
              className="h-10 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-900 focus:border-amber-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              aria-label="Remove attribute row"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-400 hover:text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}