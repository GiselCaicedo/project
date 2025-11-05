'use client';

import type { ClientQuoteRecord } from '@app/modules/client/quotes/types';
import type { ColDef } from 'ag-grid-community';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import PageHeader from '@shared/components/common/PageHeader';
import AgTable from '@shared/components/datagrid/AgTable';
import { approveClientQuoteApi } from '@shared/services/conexion';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import QuoteComments from './QuoteComments';
import QuoteObservationsView from './QuoteObservationsView';

type Props = {
  quote: ClientQuoteRecord | null;
  errorMessage: string | null;
  locale: string;
};

export default function QuoteDetailView({ quote: initialQuote, errorMessage, locale }: Props) {
  const router = useRouter();
  const { notify } = useAlerts();

  const [quote, setQuote] = useState<ClientQuoteRecord | null>(initialQuote);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    setQuote(initialQuote);
  }, [initialQuote]);

  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Cotizaciones', href: `/${locale}/client/quotes` },
    { label: quote?.consecutive ?? quote?.id ?? 'Detalle' },
  ];

  const handleApprove = async () => {
    if (!quote) {
      return;
    }

    const confirmed = window.confirm(
      `¿Está seguro de aprobar la cotización "${quote.consecutive || quote.id}"? Esta acción no se puede deshacer.`,
    );

    if (!confirmed) {
      return;
    }

    setApproving(true);
    try {
      await approveClientQuoteApi(quote.id);
      notify({ type: 'success', title: 'Cotización aprobada exitosamente' });

      // Actualizar el estado local
      setQuote(prev => prev ? { ...prev, status: 'aprobada' } : null);

      // Recargar la página para obtener datos actualizados
      router.refresh();
    } catch (error) {
      console.error('Error approving quote:', error);
      notify({
        type: 'error',
        title: 'Error al aprobar cotización',
        message: error instanceof Error ? error.message : 'No fue posible aprobar la cotización',
      });
    } finally {
      setApproving(false);
    }
  };

  const canApprove = quote && quote.status === 'pendiente' && !quote.invoice;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Detalle de la cotización"
        description="Visualiza los servicios y valores incluidos en la cotización."
        actions={(
          <div className="flex flex-wrap gap-2">
            {canApprove && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={approving}
                className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
              >
                {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Aprobar cotización
              </button>
            )}
            <Link
              href={`/${locale}/client/quotes`}
              className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Volver
            </Link>
          </div>
        )}
      />

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>
      )}

      {quote ? (
        <div className="space-y-6">
          {/* Mostrar estado de la cotización y factura asociada */}
     

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold text-gray-900">Información general</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoRow label="Estado" value={getQuoteStatusLabel(quote.status)} />
              <InfoRow label="Cliente" value={quote.client?.name ?? 'No disponible'} />
              <InfoRow label="Consecutivo" value={quote.consecutive ?? quote.id} />
              <InfoRow label="Monto" value={formatCurrency(quote.value)} />
              <InfoRow label="Creación" value={formatDate(quote.created)} />
              <InfoRow label="Actualización" value={formatDate(quote.updated)} />
              {quote.invoice && (
                <div>
                  <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">Factura</dt>
                  <dd className="mt-1">
                    <Link
                      href={`/${locale}/client/invoices/${quote.invoice.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-500 hover:underline"
                    >
                      {quote.invoice.number ?? quote.invoice.id ?? 'Ver factura'}
                      {' '}
                      →
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
            {quote.description && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900">Descripción</h3>
                <p className="mt-1 text-sm whitespace-pre-line text-gray-600">{quote.description}</p>
              </div>
            )}
            {quote.url && (
              <div className="mt-6">
                <a
                  href={quote.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Ver documento PDF →
                </a>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Servicios incluidos</h2>
            {quote.quote_detail.length > 0
              ? (
                  <>
                    <ServicesTable services={quote.quote_detail} />
                    <div className="mt-6 flex justify-end">
                      <div className="w-full max-w-sm space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium text-gray-900">{formatCurrency(quote.subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">IVA</span>
                          <span className="font-medium text-gray-900">{formatCurrency(quote.tax_one)}</span>
                        </div>
                        {quote.tax_two && quote.tax_two > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">IMP2</span>
                            <span className="font-medium text-gray-900">{formatCurrency(quote.tax_two)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between border-t border-gray-300 pt-2 text-base font-semibold">
                          <span className="text-gray-900">Total</span>
                          <span className="text-primary-600">{formatCurrency(quote.total ?? quote.value)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )
              : (
                  <p className="mt-4 text-sm text-gray-500">La cotización no tiene servicios asociados.</p>
                )}
          </section>

          {/* Observaciones del administrador (solo lectura) */}
          {(quote as any).observations && (quote as any).observations.length > 0 && (
            <QuoteObservationsView observations={(quote as any).observations} />
          )}

          {/* Comentarios del cliente (CRUD) */}
          <QuoteComments quoteId={quote.id} initialComments={(quote as any).comments || []} />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No se encontró la cotización solicitada.
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

type ServiceDetail = NonNullable<ClientQuoteRecord['quote_detail'][number]>;

type InvoiceStatus = NonNullable<ClientQuoteRecord['invoice']>['status'];

function getQuoteStatusLabel(status: ClientQuoteRecord['status']): string {
  const labels: Record<ClientQuoteRecord['status'], string> = {
    pendiente: 'Pendiente',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
  };
  return labels[status] || status;
}

function getInvoiceStatusLabel(status: InvoiceStatus): string {
  const labels: Record<InvoiceStatus, string> = {
    pagada: 'Pagada',
    pendiente: 'Pendiente',
  };
  return labels[status] || status;
}

function getInvoiceStatusStyle(status: InvoiceStatus): string {
  const styles: Record<InvoiceStatus, string> = {
    pagada: 'bg-emerald-100 text-emerald-700',
    pendiente: 'bg-amber-100 text-amber-700',
  };
  return styles[status] || 'bg-gray-100 text-gray-600';
}

function ServicesTable({ services }: { services: ServiceDetail[] }) {
  const columns: ColDef<ServiceDetail>[] = useMemo(() => [
    {
      headerName: 'Ítem',
      field: 'item',
      minWidth: 80,
      maxWidth: 100,
      cellClass: 'text-center justify-center',
    },
    {
      headerName: 'Detalle',
      field: 'service',
      flex: 1.5,
      minWidth: 200,
      valueGetter: params => params.data?.service?.name ?? 'Servicio sin nombre',
    },
    {
      headerName: 'Cantidad',
      field: 'quantity',
      minWidth: 100,
      cellClass: 'text-center justify-center',
    },
    {
      headerName: 'Vl. Unitario',
      field: 'service.price',
      minWidth: 130,
      valueFormatter: params => formatCurrency(params.data?.service?.price ?? null),
      cellClass: 'text-right justify-end',
    },
    {
      headerName: 'IVA (19%)',
      minWidth: 120,
      valueGetter: params => {
        const price = params.data?.service?.price ?? 0;
        const quantity = params.data?.quantity ?? 0;
        return price * quantity * 0.19;
      },
      valueFormatter: params => formatCurrency(params.value as number),
      cellClass: 'text-right justify-end',
    },
    {
      headerName: 'Valor Total',
      field: 'total_value',
      minWidth: 140,
      valueFormatter: params => formatCurrency(params.value as number),
      cellClass: 'text-right justify-end font-semibold',
    },
  ], []);

  const height = Math.min(400, (services.length + 1) * 46 + 60);

  return (
    <AgTable<ServiceDetail>
      rows={services}
      columns={columns}
      getRowId={row => row.id}
      height={height}
      pageSize={services.length > 10 ? 10 : services.length}
    />
  );
}

