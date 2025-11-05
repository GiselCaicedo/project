'use client';

import type { ClientServiceSummary } from '@app/modules/client/services/types';
import { ArrowUpRight, Calendar, Clock, Tag, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type Props = {
  services: ClientServiceSummary[];
};

export default function ServicesClientWidget({ services }: Props) {
  const params = useParams<{ locale?: string }>();
  const locale = typeof params?.locale === 'string' ? params.locale : 'es';

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) {
      return '-';
    }
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price == null) {
      return '-';
    }
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'COP',
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'activo' || statusLower === 'active') {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (statusLower === 'pendiente' || statusLower === 'pending') {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (statusLower === 'inactivo' || statusLower === 'inactive') {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  if (services.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-12">
        <p className="text-sm text-gray-500">No hay servicios contratados</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => {
        const serviceId = service.serviceId ?? service.id;
        const observations = Array.isArray(service.observations) ? service.observations : [];
        const lastObservation = observations.length > 0 ? observations[0] : null;
        return (
          <div
            key={service.id}
            className="group relative flex flex-col rounded-lg border border-gray-200 bg-white p-6 transition hover:shadow-sm"
          >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <h3 className="line-clamp-2 text-lg font-semibold text-gray-900">
                  {service.name}
                </h3>
                <div className="mt-2 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {service.category?.name ?? '-'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(service.status)}`}>
                  {service.status}
                </span>
                {observations.length > 0 && (
                  <span className="inline-flex items-center rounded-full border border-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                    <MessageSquare className="mr-1 h-3.5 w-3.5 text-gray-400" />
                    {observations.length}
                  </span>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="mb-4 flex-1 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-900">{formatPrice(service.price)}</span>
                <span className="text-gray-500">
                  /
                  {service.frequency || '-'}
                </span>
              </div>

              {lastObservation && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MessageSquare className="mt-0.5 h-4 w-4 text-gray-400" />
                  <span className="line-clamp-2">{lastObservation.content}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>
                  Inicio:
                  {formatDate(service.started)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>
                  Vence:
                  {formatDate(service.expiry)}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-auto border-t border-gray-100 pt-4">
              <Link
                href={`/${locale}/client/my_services/${serviceId}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                Ver Detalle
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
