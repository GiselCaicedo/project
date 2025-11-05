'use client';

import type { ClientBalanceSummary } from '../types';
import { formatCurrency } from '@shared/utils/formatters';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React from 'react';

type BalanceCardProps = {
  balance: ClientBalanceSummary;
  locale: string;
};

export function BalanceCard({ balance, locale }: BalanceCardProps) {
  const params = useParams<{ locale?: string }>();
  const currentLocale = typeof params?.locale === 'string' ? params.locale : locale;

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6">
      <div className="flex flex-col gap-6">
        {/* Saldo General */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium tracking-wide text-gray-500 uppercase">Saldo General</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {formatCurrency(balance.totalBalance, locale)}
            </p>
          </div>
          <Link
            href={`/${currentLocale}/client/dashboard/recharge`}
            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600"
          >
            Recargar Saldo
          </Link>
        </div>

        {/* Detalles del saldo */}
        <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
          <div className="rounded-xl bg-sky-50 p-4">
            <p className="text-xs font-medium tracking-wide text-sky-700 uppercase">Total Gastado</p>
            <p className="mt-2 text-xl font-semibold text-sky-900">
              {formatCurrency(balance.totalSpent, locale)}
            </p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-xs font-medium tracking-wide text-amber-700 uppercase">Total Pendiente</p>
            <p className="mt-2 text-xl font-semibold text-amber-900">
              {formatCurrency(balance.totalPending, locale)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
