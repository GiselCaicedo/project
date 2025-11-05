'use client';

import { Search, X } from 'lucide-react';
import React from 'react';

type TableFiltersBarProps = {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  rightActions?: React.ReactNode;
  className?: string;
};

export default function TableFiltersBar({
  value,
  onChange,
  onClear,
  placeholder = 'Buscar…',
  rightActions,
  className = '',
}: TableFiltersBarProps) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-full border border-gray-200 bg-white py-2 pr-9 pl-9 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
        />
        {Boolean(value) && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Limpiar búsqueda"
            title="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {rightActions ? (
        <div className="flex items-center gap-2">{rightActions}</div>
      ) : null}
    </div>
  );
}

