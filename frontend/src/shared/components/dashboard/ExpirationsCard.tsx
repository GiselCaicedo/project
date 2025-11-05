import { formatCurrency, formatDate } from '@shared/utils/formatters';
import React from 'react';

export type ExpirationCardItem = {
  id: string;
  name: string;
  description?: string | null;
  amount: number;
  expiry: string | null;
  daysUntilExpiry: number | null;
  status: 'active' | 'pending' | 'expired' | 'pagada' | 'vencida' | 'pendiente';
  url?: string | null;
  type?: 'invoice' | 'service';
};

type ExpirationsCardProps = {
  locale: string;
  items: ExpirationCardItem[];
  labels: {
    empty: string;
    dueToday: string;
    dueTomorrow: string;
    dueIn: (days: number) => string;
  };
  maxItems?: number;
};

function buildDueLabel(days: number | null | undefined, labels: ExpirationsCardProps['labels']) {
  if (days === null || days === undefined) {
    return labels.dueIn(0);
  }
  if (days <= 0) {
    return labels.dueToday;
  }
  if (days === 1) {
    return labels.dueTomorrow;
  }
  return labels.dueIn(days);
}

function getStatusStyles(status: ExpirationCardItem['status']) {
  switch (status) {
    case 'active':
    case 'pagada':
      return 'bg-emerald-100 text-emerald-700';
    case 'expired':
    case 'vencida':
      return 'bg-red-100 text-red-700';
    case 'pending':
    case 'pendiente':
    default:
      return 'bg-amber-100 text-amber-700';
  }
}

function getStatusLabel(status: ExpirationCardItem['status']) {
  const labels: Record<ExpirationCardItem['status'], string> = {
    active: 'Activo',
    pending: 'Pendiente',
    expired: 'Vencido',
    pagada: 'Pagada',
    vencida: 'Vencida',
    pendiente: 'Pendiente',
  };
  return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

export function ExpirationsCard({ locale, items, labels, maxItems = 5 }: ExpirationsCardProps) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-gray-500">{labels.empty}</p>;
  }

  return (
    <ul className="space-y-4">
      {items.slice(0, maxItems).map(item => (
        <li key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-500">{formatCurrency(item.amount ?? 0, locale)}</p>
              </div>
              <span className="text-xs font-semibold tracking-wide text-amber-600 uppercase">
                {buildDueLabel(item.daysUntilExpiry, labels)}
              </span>
            </div>
            {item.description && (
              <p className="line-clamp-1 text-xs text-gray-600">{item.description}</p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500">
              {item.type && (
                <span className="capitalize">{item.type === 'invoice' ? 'Factura' : 'Servicio'}</span>
              )}
              <span>{formatDate(item.expiry, locale)}</span>
            </div>
            <span
              className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${getStatusStyles(item.status)}`}
            >
              {getStatusLabel(item.status)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
