'use client';

import PageHeader from '@shared/components/common/PageHeader';
import AgTable from '@shared/components/datagrid/AgTable';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import type { ClientQuoteSummary } from '@app/modules/client/quotes/types';
import { useMemo } from 'react';
import { createDateFormatter } from '@shared/utils/columnFormatters';

import { formatCurrency } from '@shared/utils/formatters';
import { useParams } from 'next/navigation';

type StatusInfo = { label: string; tone: string };

const statusTone: Record<ClientQuoteSummary['status'], StatusInfo> = {
  aprobada: { label: 'Aprobada', tone: 'bg-emerald-100 text-emerald-700' },
  pendiente: { label: 'Pendiente', tone: 'bg-amber-100 text-amber-700' },
  rechazada: { label: 'Rechazada', tone: 'bg-red-100 text-red-700' },
};

type InvoiceStatus = NonNullable<ClientQuoteSummary['invoice']>['status'];

const invoiceStatusTone: Record<InvoiceStatus, StatusInfo> = {
  aprobada: { label: 'Aprobada', tone: 'bg-emerald-100 text-emerald-700' },
  pendiente: { label: 'Pendiente', tone: 'bg-amber-100 text-amber-700' },
  rechazada: { label: 'Rechazada', tone: 'bg-red-100 text-red-700' },
  en_proceso: { label: 'En proceso', tone: 'bg-slate-100 text-slate-700' },
};

export default function MainQuotesClient({
  quotes,
  errorMessage,
}: {
  quotes: ClientQuoteSummary[];
  errorMessage: string | null;
}) {
  const { locale } = useParams() as { locale: string };

  const columns: ColDef<ClientQuoteSummary>[] = useMemo(() => {
    const dateFormatter = createDateFormatter(locale);

    return [

      { headerName: 'Referencia', field: 'reference', minWidth: 160, flex: 1 },
      { headerName: 'Descripción', field: 'description', flex: 1.4, minWidth: 220 },
      {
        headerName: 'Monto',
        field: 'value',
        minWidth: 140,
        valueFormatter: params => formatCurrency(params.value as number, locale),
        cellClass: 'text-right justify-end',
      },
      {
        headerName: 'Factura',
        field: 'invoice',
        minWidth: 200,
        cellRenderer: (params: ICellRendererParams<ClientQuoteSummary>) => {
          const invoice = params.data.invoice;
          if (!invoice) {
            return <span className="text-xs text-gray-400">Sin factura</span>;
          }

          const tone = invoiceStatusTone[invoice.status] ?? { label: invoice.status, tone: 'bg-gray-100 text-gray-600' };
          const amountLabel =
            typeof invoice.amount === 'number' && Number.isFinite(invoice.amount)
              ? formatCurrency(invoice.amount, locale)
              : null;

          return (
            <div className="flex flex-col gap-1 text-xs text-left">
              <span className="text-sm font-semibold text-gray-900">{invoice.number ?? invoice.id ?? 'Factura sin número'}</span>
              <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 font-semibold ${tone.tone}`}>
                {tone.label}
              </span>
              {amountLabel ? <span className="text-gray-500">{amountLabel}</span> : null}
            </div>
          );
        },
      },
      {
        headerName: 'Estado',
        field: 'status',
        minWidth: 140,
        cellRenderer: (params: ICellRendererParams<ClientQuoteSummary>) => {
          const tone = statusTone[params.data.status] ?? { label: params.data.status, tone: 'bg-gray-100 text-gray-600' };
          return (
            <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${tone.tone}`}>
              {tone.label}
            </span>
          );
        },
        cellClass: 'text-center justify-center',
      },
      {
        headerName: 'Creación',
        field: 'created',
        minWidth: 140,
        valueFormatter: dateFormatter,
        cellClass: 'text-center justify-center',
      },
      {
        headerName: 'Actualizado',
        field: 'updated',
        minWidth: 140,
        valueFormatter: dateFormatter,
        cellClass: 'text-center justify-center',
      },
    ];
  }, [locale]);

  const pageSize = quotes.length > 10 ? 10 : quotes.length || 10;

  return (
    <div>
      <PageHeader title="Cotizaciones" description="Consulta y gestiona tus cotizaciones." />
      {errorMessage ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      ) : null}
      <AgTable<ClientQuoteSummary>
        rows={quotes}
        columns={columns}
        getRowId={row => row.id}
        height={520}
        pageSize={pageSize}
      />
    </div>
  );
}
