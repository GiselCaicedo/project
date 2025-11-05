'use client';

import type { ServiceRecord, ServiceStatus } from './types';
import { ChevronDown, ChevronRight, Eye, Layers3, PencilLine, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';

type Props = {
  services: ServiceRecord[];
  expandedServiceId: string | null;
  onToggleExpand: (serviceId: string) => void;
  onEdit: (serviceId: string) => void;
  onDelete: (service: ServiceRecord) => void;
  renderExpandedContent?: (service: ServiceRecord) => React.ReactNode;
};

const statusTone: Record<ServiceStatus, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-700',
};

export default function ServiceCardList({
  services,
  expandedServiceId,
  onToggleExpand,
  onEdit,
  onDelete,
  renderExpandedContent,
}: Props) {
  const router = useRouter();
  const { locale } = useParams() as { locale: string };
  const t = useTranslations('Servicios.List');

  if (services.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <Layers3 className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-4 text-sm font-medium text-gray-500">{t('noServices')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {services.map((service) => {
        const isExpanded = expandedServiceId === service.id;
        const statusClass = statusTone[service.status];
        const statusLabel = t(`table.status.${service.status}`);

        return (
          <div
            key={service.id}
            className={`overflow-hidden rounded-lg border transition-all ${
              isExpanded
                ? 'border-gray-300 bg-gray-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'

            }`}
          >
            {/* Card Header */}
            <div className="flex items-center gap-3 p-4">
              {/* Expand/Collapse Button */}
              <button
                type="button"
                onClick={() => onToggleExpand(service.id)}
                className="flex-shrink-0 text-gray-400 transition hover:text-gray-600"
              >
                {isExpanded
                  ? (
                      <ChevronDown className="h-5 w-5" />
                    )
                  : (
                      <ChevronRight className="h-5 w-5" />
                    )}
              </button>

              {/* Service Icon */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
                <Layers3 className="h-5 w-5 text-primary-600" />
              </div>

              {/* Service Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-gray-900">
                    {service.name}
                  </h3>
                  <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}>
                    {statusLabel}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-gray-500">
                  {service.description || t('noDescription')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/${locale}/admin/services/${service.id}`);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>{t('viewDetailButton')}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(service);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{t('deleteButton')}</span>
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && renderExpandedContent && (
              <div className="border-t border-gray-200 bg-white">
                {renderExpandedContent(service)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
