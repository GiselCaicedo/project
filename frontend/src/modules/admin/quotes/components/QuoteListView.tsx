'use client';

import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import type { QuoteSummary, CreateQuoteInput, QuoteDetail } from './types';
import PageHeader from '@shared/components/common/PageHeader';
import AgTable from '@shared/components/datagrid/AgTable';
import SidePanel from '@shared/components/common/SidePanel';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import {
  createAdminQuoteApi,
  getAdminClientsListApi,
  getAdminServicesListApi,
  type Client,
} from '@shared/services/conexion';
import { formatCurrency } from '@shared/utils/formatters';
import { createDateFormatter } from '@shared/utils/columnFormatters';

import { FileText, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ServiceRecord } from '@admin/services/types';

import QuoteCreateForm from './QuoteCreateForm';

type QuoteListViewProps = {
  initialQuotes: QuoteSummary[];
  initialError?: string | null;
};

type QuoteRow = QuoteSummary;

type StatusInfo = { label: string; tone: string };

const statusTone: Record<QuoteSummary['status'], StatusInfo> = {
  aprobada: { label: 'Aprobada', tone: 'bg-primary-100 text-primary-700' },
  pendiente: { label: 'Pendiente', tone: 'bg-amber-100 text-amber-700' },
  rechazada: { label: 'Rechazada', tone: 'bg-red-100 text-red-700' },
};

type InvoiceStatus = NonNullable<QuoteSummary['invoice']>['status'];

const invoiceStatusTone: Record<InvoiceStatus, StatusInfo> = {
  aprobada: { label: 'Aprobada', tone: 'bg-emerald-100 text-emerald-700' },
  pendiente: { label: 'Pendiente', tone: 'bg-amber-100 text-amber-700' },
  rechazada: { label: 'Rechazada', tone: 'bg-red-100 text-red-700' },
  en_proceso: { label: 'En proceso', tone: 'bg-slate-100 text-slate-700' },
};

const cloneSummary = (quote: QuoteSummary): QuoteSummary => ({ ...quote });

const headerDescription =
  'Gestiona las cotizaciones de tus clientes, descarga PDFs y conviértelas en facturas cuando sea necesario.';

const mapDetailToSummary = (quote: QuoteDetail): QuoteSummary => {
  const pdfAction = quote.actions.find(action => action.type === 'pdf');
  const invoiceAttachment = quote.attachments.find(attachment => Boolean(attachment.invoiceId));

  return {
    id: quote.id,
    reference: quote.reference,
    client: quote.client,
    issuedAt: quote.issuedAt,
    updatedAt: quote.updatedAt,
    status: quote.status,
    services: quote.services.length,
    amount: quote.amount,
    pdfUrl: pdfAction?.url ?? null,
    invoice: invoiceAttachment
      ? {
          id: invoiceAttachment.invoiceId,
          number: invoiceAttachment.invoiceNumber,
          status: invoiceAttachment.invoiceStatus,
          amount: invoiceAttachment.invoiceAmount,
        }
      : null,
  };
};

export default function QuoteListView({ initialQuotes, initialError = null }: QuoteListViewProps) {
  const { locale } = useParams() as { locale: string };
  const containerRef = useRef<HTMLDivElement>(null);

  const { notify } = useAlerts();

  const [quotes, setQuotes] = useState<QuoteSummary[]>(() => initialQuotes.map(cloneSummary));
  const [quickFilter, setQuickFilter] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [creatingQuote, setCreatingQuote] = useState(false);

  const rows = useMemo<QuoteRow[]>(() => quotes.map(cloneSummary), [quotes]);

  const breadcrumbs = useMemo(
    () => [
      { label: 'Panel admin', href: `/${locale}/admin/dashboard` },
      { label: 'Cotizaciones' },
    ],
    [locale],
  );

  const columns = useMemo<ColDef<QuoteRow>[]>(() => {
    const dateFormatter = createDateFormatter(locale);

    return [
      {
        headerName: 'Referencia',
        field: 'reference',
        flex: 1.4,
        minWidth: 320,
        cellRenderer: (params: ICellRendererParams<QuoteRow>) => (
          <Link
            href={`/${locale}/admin/quotes/${params.data.id}`}
            className="inline-flex items-center gap-2 text-left text-sm font-semibold text-primary-700 hover:underline"
          >
            <FileText className="h-4 w-4" />
            {params.data.reference}
          </Link>
        ),
      },
      {
        headerName: 'Cliente',
        field: 'client.name',
        minWidth: 200,
        valueGetter: params => params.data.client.name,
      },
      {
        headerName: 'Servicios',
        field: 'services',
        minWidth: 120,
        valueFormatter: params => `${params.value ?? 0}`,
        cellClass: 'text-center justify-center',
      },
      {
        headerName: 'Monto',
        field: 'amount',
        minWidth: 140,
        valueFormatter: params => formatCurrency(params.value as number, locale),
        cellClass: 'text-center justify-center',
      },
      {
        headerName: 'Factura',
        field: 'invoice',
        minWidth: 200,
        cellRenderer: (params: ICellRendererParams<QuoteRow>) => {
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
            <div className="flex flex-col gap-1 text-left text-xs">
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
        cellRenderer: (params: ICellRendererParams<QuoteRow>) => {
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
        headerName: 'Emitida',
        field: 'issuedAt',
        minWidth: 140,
        valueFormatter: dateFormatter,
        cellClass: 'text-center justify-center',
      },
      {
        headerName: 'Actualizada',
        field: 'updatedAt',
        minWidth: 140,
        valueFormatter: dateFormatter,
      },
      {
        headerName: 'PDF',
        field: 'pdfUrl',
        minWidth: 140,
        cellRenderer: (params: ICellRendererParams<QuoteRow>) =>
          params.data.pdfUrl ? (
            <Link
              href={params.data.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50"
            >
              <FileText className="h-3.5 w-3.5" />
              Abrir PDF
            </Link>
          ) : (
            <span className="text-xs text-gray-400">Sin PDF</span>
          ),
        cellClass: 'text-center justify-center',
      },
      {
        headerName: 'Acciones',
        field: 'actions',
        minWidth: 160,
        maxWidth: 180,
        pinned: 'right',
        suppressMenu: true,
        sortable: false,
        cellRenderer: (params: ICellRendererParams<QuoteRow>) => (
          <Link
            href={`/${locale}/admin/quotes/${params.data.id}`}
            className="inline-flex items-center gap-1 rounded-full border border-primary-200 px-3 py-1 text-xs font-medium text-primary-700 transition hover:bg-primary-50"
          >
            Ver detalle
          </Link>
        ),
        cellClass: 'text-center justify-center',
      },
    ];
  }, [locale]);

  const fetchCatalogs = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const [clientsPayload, servicesPayload] = await Promise.all([getAdminClientsListApi(), getAdminServicesListApi()]);
      const clientOptions = (clientsPayload.clients ?? []).map(client => ({ id: client.id, name: client.name }));
      const activeServices = (servicesPayload.services ?? []).filter(service => service.status === 'active');

      setClients(clientOptions);
      setServices(activeServices);
      setCatalogLoaded(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible cargar la información necesaria';
      setCatalogError(message);
      setCatalogLoaded(false);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isCreateOpen) {
      return;
    }
    if (catalogLoaded || catalogLoading) {
      return;
    }

    void fetchCatalogs();
  }, [catalogLoaded, catalogLoading, fetchCatalogs, isCreateOpen]);

  const handleOpenCreate = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const handleCloseCreate = useCallback(() => {
    setIsCreateOpen(false);
  }, []);

  const handleCreateQuote = useCallback(
    async (payload: CreateQuoteInput) => {
      setCreatingQuote(true);
      try {
        const created = await createAdminQuoteApi(payload);
        const summary = mapDetailToSummary(created);
        setQuotes(current => [summary, ...current]);
        notify({ type: 'success', title: 'Cotización creada correctamente' });
        setIsCreateOpen(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No fue posible crear la cotización';
        throw new Error(message);
      } finally {
        setCreatingQuote(false);
      }
    },
    [notify],
  );

  return (
    <div className="space-y-6" ref={containerRef}>
      <PageHeader breadcrumbs={breadcrumbs} title="Gestión de cotizaciones" description={headerDescription} />

      {initialError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{initialError}</div>
      ) : null}

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={quickFilter}
              onChange={event => setQuickFilter(event.target.value)}
              placeholder="Buscar cotización…"
              className="w-full rounded-full border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" />
            Nueva cotización
          </button>
        </div>

        <div className="mt-4">
          <AgTable<QuoteRow>
            rows={rows}
            columns={columns}
            quickFilterText={quickFilter}
            getRowId={data => data.id}
            height={520}
          />
        </div>
      </div>

      <SidePanel title="Crear cotización" open={isCreateOpen} onClose={handleCloseCreate} reserveRef={containerRef}>
        <QuoteCreateForm
          open={isCreateOpen}
          locale={locale}
          clients={clients}
          services={services}
          loading={catalogLoading}
          errorMessage={catalogError}
          onReload={fetchCatalogs}
          onCancel={handleCloseCreate}
          onSubmit={handleCreateQuote}
          submitting={creatingQuote}
        />
      </SidePanel>
    </div>
  );
}
