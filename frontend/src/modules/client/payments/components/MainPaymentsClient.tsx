'use client';

import PageHeader from '@shared/components/common/PageHeader';
import AgTable from '@shared/components/datagrid/AgTable';
import type { ColDef } from 'ag-grid-community';
import type { ClientPaymentSummary } from '@app/modules/client/payments/types';
import { useMemo } from 'react';
import { createDateFormatter } from '@shared/utils/columnFormatters';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function MainPaymentsClient({ payments, errorMessage }: { payments: ClientPaymentSummary[]; errorMessage: string | null }) {
  const params = useParams<{ locale?: string }>();
  const locale = typeof params?.locale === 'string' ? params.locale : 'es';

  const columns: ColDef<ClientPaymentSummary>[] = useMemo(() => {
    const dateFormatter = createDateFormatter();

    return [
      { headerName: 'Código', field: 'code', minWidth: 140 },
      { headerName: 'Valor', field: 'value', valueFormatter: p => formatCurrency(p.value), minWidth: 130, cellClass: 'text-right justify-end' },
      { headerName: 'Tipo', field: 'type', minWidth: 120 },
      { headerName: 'Método', field: 'payment_method.name', valueGetter: p => p.data.payment_method?.name ?? '-', minWidth: 160 },
      { headerName: 'Estado', field: 'status_pay', minWidth: 120, cellClass: 'text-center justify-center' },
      { headerName: 'Fecha', field: 'created', valueFormatter: dateFormatter, minWidth: 140, cellClass: 'text-center justify-center' },
      {
        headerName: 'Acciones',
        field: 'actions',
        minWidth: 120,
        maxWidth: 140,
        cellClass: 'text-center justify-center',
        sortable: false,
        filter: false,
        cellRenderer: (params) => {
          const paymentId = params.data?.id;
          if (!paymentId) return '-';
          return (
            <Link
              href={`/${locale}/client/payments/${paymentId}`}
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
    <div>
      <PageHeader title="Pagos" description="Historial y estado de tus pagos." />
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}
      <AgTable<ClientPaymentSummary>
        rows={payments}
        columns={columns}
        getRowId={(r) => r.id}
        height={520}
        pageSize={payments.length > 10 ? 10 : payments.length || 10}
      />
    </div>
  );
}

const formatCurrency = (value?: string | null) => {
  if (!value) return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(num);
};
