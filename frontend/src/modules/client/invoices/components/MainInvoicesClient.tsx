'use client';

import PageHeader from '@shared/components/common/PageHeader';
import AgTable from '@shared/components/datagrid/AgTable';
import type { ColDef } from 'ag-grid-community';
import type { ClientInvoiceSummary } from '@app/modules/client/invoices/types';
import { useMemo } from 'react';
import { createDateFormatter } from '@shared/utils/columnFormatters';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function MainInvoicesClient({ invoices, errorMessage }: { invoices: ClientInvoiceSummary[]; errorMessage: string | null }) {
  const params = useParams<{ locale?: string }>();
  const locale = typeof params?.locale === 'string' ? params.locale : 'es';

  const columns: ColDef<ClientInvoiceSummary>[] = useMemo(() => {
    const dateFormatter = createDateFormatter();

    return [
      { headerName: 'Descripción', field: 'description', flex: 1, minWidth: 200 },
      { headerName: 'Subtotal', field: 'subtotal', valueFormatter: p => formatCurrency(p.value), minWidth: 130, cellClass: 'text-right justify-end' },
      { headerName: 'Impuesto 1', field: 'tax_one', valueFormatter: p => formatCurrency(p.value), minWidth: 130, cellClass: 'text-right justify-end' },
      { headerName: 'Impuesto 2', field: 'tax_two', valueFormatter: p => formatCurrency(p.value), minWidth: 130, cellClass: 'text-right justify-end' },
      { headerName: 'Total', field: 'total', valueFormatter: p => formatCurrency(p.value), minWidth: 130, cellClass: 'text-right justify-end' },
      { headerName: 'Vencimiento', field: 'expiry', valueFormatter: dateFormatter, minWidth: 140, cellClass: 'text-center justify-center' },
      { headerName: 'Creada', field: 'created', valueFormatter: dateFormatter, minWidth: 140, cellClass: 'text-center justify-center' },
      {
        headerName: 'Acciones',
        field: 'actions',
        minWidth: 120,
        maxWidth: 140,
        cellClass: 'text-center justify-center',
        sortable: false,
        filter: false,
        cellRenderer: (params) => {
          const invoiceId = params.data?.id;
          if (!invoiceId) return '-';
          return (
            <Link
              href={`/${locale}/client/invoices/${invoiceId}`}
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
      <PageHeader title="Facturas" description="Revisa tus facturas emitidas y su estado." />
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}
      <AgTable<ClientInvoiceSummary>
        rows={invoices}
        columns={columns}
        getRowId={(r) => r.id}
        height={520}
        pageSize={invoices.length > 10 ? 10 : invoices.length || 10}
      />
    </div>
  );
}

const formatCurrency = (value?: number | null) => {
  if (value == null) return '-';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
};
