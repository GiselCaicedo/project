"use client";

import AgTable from '@shared/components/datagrid/AgTable';
import type { ColDef } from 'ag-grid-community';
import type { ClientServiceSummary } from '@app/modules/client/services/types';
import { useMemo } from 'react';
import { createDateFormatter } from '@shared/utils/columnFormatters';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type Props = {
  services: ClientServiceSummary[];
};

export default function ServicesClientList({ services }: Props) {
  const params = useParams<{ locale?: string }>();
  const locale = typeof params?.locale === 'string' ? params.locale : 'es';

  const columns: ColDef<ClientServiceSummary>[] = useMemo(() => {
    const dateFormatter = createDateFormatter();

    return [
      { headerName: 'Servicio', field: 'name', flex: 1, minWidth: 200 },
      { headerName: 'Categoría', field: 'category.name', valueGetter: p => p.data.category?.name ?? '-', minWidth: 140 },
      { headerName: 'Precio', field: 'price', valueFormatter: p => p.value == null ? '-' : new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(p.value), minWidth: 120, cellClass: 'text-right justify-end' },
      { headerName: 'Frecuencia', field: 'frequency', minWidth: 120 },
      { headerName: 'Inicio', field: 'started', valueFormatter: dateFormatter, minWidth: 110, cellClass: 'text-center justify-center' },
      { headerName: 'Vence', field: 'expiry', valueFormatter: dateFormatter, minWidth: 110, cellClass: 'text-center justify-center' },
      { headerName: 'Estado', field: 'status', minWidth: 110, cellClass: 'text-center justify-center' },
      {
        headerName: 'Acciones',
        field: 'actions',
        minWidth: 120,
        maxWidth: 140,
        cellClass: 'text-center justify-center',
        sortable: false,
        filter: false,
        cellRenderer: (params) => {
          const serviceId = params.data?.serviceId ?? params.data?.id;
          if (!serviceId) return '-';
          return (
            <Link
              href={`/${locale}/client/services/${serviceId}`}
              className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Vista
            </Link>
          );
        },
      },
    ];
  }, [locale]);

  return (
    <AgTable<ClientServiceSummary>
      rows={services}
      columns={columns}
      getRowId={(r) => r.id}
      height={520}
      pageSize={services.length > 10 ? 10 : services.length || 10}
    />
  );
}

