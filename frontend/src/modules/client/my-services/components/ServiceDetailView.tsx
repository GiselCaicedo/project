'use client';

import type { ClientServiceDetail } from '@app/modules/client/services/types';
import type { ColDef } from 'ag-grid-community';
import PageHeader from '@shared/components/common/PageHeader';
import AgTable from '@shared/components/datagrid/AgTable';
import { createDateFormatter } from '@shared/utils/columnFormatters';
import Link from 'next/link';
import { useMemo } from 'react';

type Props = {
  service: ClientServiceDetail | null;
  errorMessage: string | null;
  locale: string;
};

type UsageRow = {
  id: string;
  startDate: string | null;
  endDate: string | null;
  usage: string | null;
  status: string | null;
  createdAt: string;
};

export default function ServiceDetailView({ service, errorMessage, locale }: Props) {
  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Servicios', href: `/${locale}/client/my_services` },
    { label: service?.name ?? 'Detalle' },
  ];

  const usageColumns: ColDef<UsageRow>[] = useMemo(() => {
    const dateFormatter = createDateFormatter();

    return [
      {
        headerName: 'Periodo',
        field: 'startDate',
        valueGetter: params => formatUsagePeriod(params.data?.startDate ?? null, params.data?.endDate ?? null),
        flex: 1,
        minWidth: 180,
      },
      {
        headerName: 'Consumo',
        field: 'usage',
        valueGetter: params => params.data?.usage ?? '-',
        flex: 0.8,
        minWidth: 120,
      },
      {
        headerName: 'Estado',
        field: 'status',
        valueGetter: params => params.data?.status ?? '-',
        flex: 0.8,
        minWidth: 120,
      },
      {
        headerName: 'Registrado',
        field: 'createdAt',
        valueFormatter: dateFormatter,
        flex: 1,
        minWidth: 130,
        cellClass: 'text-center justify-center',
      },
    ];
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Detalle del servicio"
        description="Consulta la información completa del servicio contratado."
        actions={(
          <Link
            href={`/${locale}/client/my_services`}
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

      {service
        ? (
            <div className="space-y-6">
              <section className="rounded-xl border border-gray-200 bg-white p-6">
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
                    <p className="mt-1 text-sm whitespace-pre-line text-gray-600">{service.description}</p>
                  </div>
                )}
              </section>

              {(service.taxOne || service.taxTwo) && (
                <section className="rounded-xl border border-gray-200 bg-white p-6">
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

              {service.observations && service.observations.length > 0 && (
                <section className="rounded-xl border border-gray-200 bg-white p-6  ">
                  <h2 className="text-base font-semibold text-gray-900">Observaciones</h2>
                  <div className="mt-4 space-y-4">
                    {service.observations.map(obs => (
                      <div key={obs.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                        <p className="text-sm text-gray-700 whitespace-pre-line">{obs.content}</p>
                        {obs.created && (
                          <p className="mt-2 text-xs text-gray-500">
                            {formatDate(obs.created)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded-xl border border-gray-200 bg-white p-6  ">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-base font-semibold text-gray-900">Historial de uso</h2>
                  <p className="text-xs text-gray-500">
                    {service.usage.length > 0 ? `${service.usage.length} registros encontrados` : 'Sin registros de uso'}
                  </p>
                </div>
                {service.usage.length > 0
                  ? (
                      <AgTable<UsageRow>
                        rows={service.usage}
                        columns={usageColumns}
                        getRowId={row => row.id}
                        height={400}
                        pageSize={service.usage.length > 10 ? 10 : service.usage.length}
                      />
                    )
                  : (
                      <p className="text-sm text-gray-500">No hay registros de uso asociados al servicio.</p>
                    )}
              </section>
            </div>
          )
        : (
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
      <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</dt>
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
  if (value == null) {
    return '-';
  }
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  } catch (error) {
    console.warn('Unable to format currency value', error);
    return String(value);
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatUsagePeriod(start: string | null, end: string | null) {
  const startFormatted = formatDate(start);
  const endFormatted = formatDate(end);
  if (startFormatted === '-' && endFormatted === '-') {
    return '-';
  }
  if (endFormatted === '-') {
    return startFormatted;
  }
  if (startFormatted === '-') {
    return endFormatted;
  }
  return `${startFormatted} – ${endFormatted}`;
}
