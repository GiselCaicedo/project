'use client';

import type { ServiceRecord } from './types';
import { formatCurrency } from '@shared/utils/formatters';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

type Props = {
  service: ServiceRecord;
};

export default function ServiceExpandedView({ service }: Props) {
  const { locale } = useParams() as { locale: string };
  const t = useTranslations('Servicios.Detail');

  const formatDate = (date: string | null | undefined): string => {
    if (!date) {
      return '—';
    }
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(date));
    } catch {
      return '—';
    }
  };

  const formatTaxLabel = (tax: ServiceRecord['taxOne']) => {
    if (!tax) {
      return '—';
    }
    return `${tax.name} (${tax.percentage.toFixed(2)}%)`;
  };

  return (
    <div className="bg-white p-6">
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-3">
        {/* Columna 1: Información básica */}
        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('name')}</p>
            <p className="mt-1.5 text-sm font-semibold text-gray-900">{service.name}</p>
          </div>

          {service.description && (
            <div>
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('description')}</p>
              <p className="mt-1.5 text-sm text-gray-700">{service.description}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('category')}</p>
            <p className="mt-1.5 text-sm font-semibold text-gray-900">
              {service.category?.name ?? t('uncategorized')}
            </p>
          </div>

          {service.unit && (
            <div>
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('unit')}</p>
              <p className="mt-1.5 text-sm font-semibold text-gray-900">{service.unit}</p>
            </div>
          )}
        </div>

        {/* Columna 2: Precios e impuestos */}
        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('price')}</p>
            <p className="mt-1.5 text-lg font-bold text-gray-900">
              {formatCurrency(service.price ?? 0, locale)}
            </p>
          </div>

          {service.subtotal != null && (
            <div>
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('subtotal')}</p>
              <p className="mt-1.5 text-sm font-semibold text-gray-900">
                {formatCurrency(service.subtotal, locale)}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('taxOne')}</p>
            <p className="mt-1.5 text-sm font-semibold text-gray-900">{formatTaxLabel(service.taxOne)}</p>
          </div>

          {service.taxTwo && (
            <div>
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('taxTwo')}</p>
              <p className="mt-1.5 text-sm font-semibold text-gray-900">{formatTaxLabel(service.taxTwo)}</p>
            </div>
          )}
        </div>

        {/* Columna 3: Fechas y estadísticas */}
        <div className="space-y-5">
          {service.frequency && (
            <div>
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('frequency')}</p>
              <p className="mt-1.5 text-sm font-semibold text-gray-900">{service.frequency}</p>
            </div>
          )}

          {(service.startDate || service.endDate) && (
            <div>
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('dates')}</p>
              <p className="mt-1.5 text-sm font-semibold text-gray-900">
                {formatDate(service.startDate)}
                {' '}
                →
                {formatDate(service.endDate)}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('clients')}</p>
            <p className="mt-1.5 text-sm font-semibold text-gray-900">
              {service.clientsCount ?? 0}
              {' '}
              {t('clientsLabel')}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('status')}</p>
            <span
              className={`mt-1.5 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                service.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {service.status === 'active' ? t('statusActive') : t('statusInactive')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
