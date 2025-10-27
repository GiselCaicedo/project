"use client";

import PageHeader from '@shared/components/common/PageHeader';
import Link from 'next/link';
import type { ClientServiceDetail } from '@app/modules/client/services/types';

type Props = {
  service: ClientServiceDetail | null;
  errorMessage: string | null;
  locale: string;
};

export default function ServiceDetailView({ service, errorMessage, locale }: Props) {
  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Servicios', href: `/${locale}/client/services` },
    { label: service?.name ?? 'Detalle' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Detalle del servicio"
        description="Consulta la información completa del servicio contratado."
        actions={(
          <Link
            href={`/${locale}/client/services`}
            className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Volver
          </Link>
        )}
      />

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {service ? (
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Información general</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoRow label="Servicio" value={service.name} />
              <InfoRow label="Estado" value={formatStatus(service.status)} />
              <InfoRow label="Categoría" value={service.category?.name ?? 'Sin categoría'} />
              <InfoRow label="Precio" value={formatCurrency(service.price)} />
              <InfoRow label="Frecuencia" value={service.frequency ?? 'Sin frecuencia'} />
              <InfoRow label="Unidad" value={service.unit ?? 'No especificada'} />
              <InfoRow label="Inicio" value={formatDate(service.started)} />
              <InfoRow label="Entrega" value={formatDate(service.delivery)} />
              <InfoRow label="Vence" value={formatDate(service.expiry)} />
              <InfoRow label="Subtotal" value={formatCurrency(service.subtotal)} />
            </dl>
            {service.description && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900">Descripción</h3>
                <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">{service.description}</p>
              </div>
            )}
            {(service.urlApi || service.tokenApi) && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoRow label="URL API" value={service.urlApi ?? 'No asignada'} />
                <InfoRow label="Token API" value={service.tokenApi ?? 'No asignado'} />
              </div>
            )}
          </section>

          {(service.taxOne || service.taxTwo) && (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">Impuestos asociados</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {service.taxOne && (
                  <InfoRow
                    label={service.taxOne.name}
                    value={`${service.taxOne.percentage?.toFixed(2) ?? '0'}%`}
                  />
                )}
                {service.taxTwo && (
                  <InfoRow
                    label={service.taxTwo.name}
                    value={`${service.taxTwo.percentage?.toFixed(2) ?? '0'}%`}
                  />
                )}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-gray-900">Historial de uso</h2>
              <p className="text-xs text-gray-500">
                {service.usage.length > 0 ? `${service.usage.length} registros encontrados` : 'Sin registros de uso'}
              </p>
            </div>
            {service.usage.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Periodo</th>
                      <th className="px-3 py-2 text-left font-medium">Consumo</th>
                      <th className="px-3 py-2 text-left font-medium">Estado</th>
                      <th className="px-3 py-2 text-left font-medium">Registrado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {service.usage.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-gray-700">
                          {formatUsagePeriod(item.startDate, item.endDate)}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{item.usage ?? '-'}</td>
                        <td className="px-3 py-2 text-gray-700">{item.status ?? '-'}</td>
                        <td className="px-3 py-2 text-gray-700">{formatDate(item.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">No hay registros de uso asociados al servicio.</p>
            )}
          </section>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No se encontró la información del servicio solicitado.
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function formatStatus(status: ClientServiceDetail['status']) {
  switch (status) {
    case 'active':
      return 'Activo';
    case 'inactive':
      return 'Inactivo';
    default:
      return status;
  }
}

function formatCurrency(value: number | null | undefined) {
  if (value == null) return '-';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
  } catch (error) {
    console.warn('Unable to format currency value', error);
    return String(value);
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatUsagePeriod(start: string | null, end: string | null) {
  const startFormatted = formatDate(start);
  const endFormatted = formatDate(end);
  if (startFormatted === '-' && endFormatted === '-') return '-';
  if (endFormatted === '-') return startFormatted;
  if (startFormatted === '-') return endFormatted;
  return `${startFormatted} – ${endFormatted}`;
}
