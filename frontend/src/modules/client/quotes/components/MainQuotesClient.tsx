'use client';

import type { ClientQuoteSummary } from '@app/modules/client/quotes/types';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import PageHeader from '@shared/components/common/PageHeader';
import AgTable from '@shared/components/datagrid/AgTable';

import { createDateFormatter } from '@shared/utils/columnFormatters';
import { formatCurrency } from '@shared/utils/formatters';
import { Eye } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type StatusInfo = { label: string; tone: string };

const statusTone: Record<ClientQuoteSummary['status'], StatusInfo> = {
  aprobada: { label: 'Aprobada', tone: 'bg-emerald-100 text-emerald-700' },
  pendiente: { label: 'Pendiente', tone: 'bg-amber-100 text-amber-700' },
};

type InvoiceStatus = NonNullable<ClientQuoteSummary['invoice']>['status'];

const invoiceStatusTone: Record<InvoiceStatus, StatusInfo> = {
  pagada: { label: 'Aprobada', tone: 'bg-emerald-100 text-emerald-700' },
  pendiente: { label: 'Pendiente', tone: 'bg-amber-100 text-amber-700' },
};

export default function MainQuotesClient({
  quotes: initialQuotes,
  errorMessage,
}: {
  quotes: ClientQuoteSummary[];
  errorMessage: string | null;
}) {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Cotizaciones' },
  ];
  const { notify } = useAlerts();
  const [quotes, setQuotes] = useState<ClientQuoteSummary[]>(initialQuotes);

  const handleViewQuote = (id: string) => {
    router.push(`/${locale}/client/quotes/${id}`);
  };

  const columns: ColDef<ClientQuoteSummary>[] = useMemo(() => {
    const dateFormatter = createDateFormatter(locale);

    return [
      { headerName: 'Consecutivo', field: 'consecutive', minWidth: 160, flex: 1 },
      { headerName: 'Descripción', field: 'description', flex: 1.4, minWidth: 220 },
      {
        headerName: 'Monto',
        field: 'value',
        minWidth: 140,
        valueFormatter: params => formatCurrency(params.value as number, locale),
        cellClass: 'text-right justify-end',
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
        headerName: 'Factura',
        field: 'invoice',
        minWidth: 200,
        cellRenderer: (params: ICellRendererParams<ClientQuoteSummary>) => {
          const invoice = params.data.invoice;
          if (!invoice) {
            return <span className="text-xs text-gray-400">Sin factura</span>;
          }

          const tone = invoiceStatusTone[invoice.status] ?? { label: invoice.status, tone: 'bg-gray-100 text-gray-600' };
          const amountLabel
            = typeof invoice.amount === 'number' && Number.isFinite(invoice.amount)
              ? formatCurrency(invoice.amount, locale)
              : null;

          return (
            <div className="flex flex-col gap-1 text-left">
              <div className="flex flex-row items-center gap-1">
                <span className="text-sm font-semibold text-gray-900">{invoice.number ?? invoice.id ?? 'Factura sin número'}</span>
               
              </div>
            </div>
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
      {
        headerName: 'Acciones',
        field: 'id',
        minWidth: 100,
        maxWidth: 100,
        pinned: 'right',
        lockPosition: true,
        suppressMovable: true,
        cellRenderer: (params: ICellRendererParams<ClientQuoteSummary>) => {
          const quoteId = params.data.id;

          return (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleViewQuote(quoteId)}
                className="inline-flex items-center justify-center rounded-md p-1.5 text-primary-600 transition hover:bg-primary-50"
                title="Ver detalle"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          );
        },
        cellClass: 'text-center justify-center',
        sortable: false,
        filter: false,
      },
    ];
  }, [locale]);

  const pageSize = quotes.length > 10 ? 10 : quotes.length || 10;

  console.log('Rendering MainQuotesClient with quotes:', quotes);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Cotizaciones"
        description="Consulta tus cotizaciones recibidas."
        actions={(
          <button
            type="button"
            onClick={() => router.push(`/${locale}/client/quotes/new`)}
            className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
          >
            Nueva cotización
          </button>
        )}
      />
      {errorMessage
        ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )
        : null}
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
