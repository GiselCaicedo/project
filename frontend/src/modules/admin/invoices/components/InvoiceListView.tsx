'use client';

import type {
  AdminInvoiceCatalog,
  AdminInvoiceListItem,
  AdminInvoiceRecord,
  AdminInvoiceStatus,
  PersistAdminInvoiceInput,
} from '@admin/data/invoices';
import type { ColDef, GridApi, ICellRendererParams } from 'ag-grid-community';
import InvoiceForm from '@admin/invoices/components/InvoiceForm';
import PageHeader from '@shared/components/common/PageHeader';
import SidePanel from '@shared/components/common/SidePanel';
import AgTable from '@shared/components/datagrid/AgTable';
import {
  createAdminInvoiceApi,
  deleteAdminInvoiceApi,
  getAdminInvoiceByIdApi,
  getAdminInvoicesApi,
  updateAdminInvoiceApi,
} from '@shared/services/conexion';
import { createDateFormatter } from '@shared/utils/columnFormatters';
import { ArrowUpRight, PlusCircle, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useMemo, useRef, useState } from 'react';
import TableFiltersBar from '@shared/components/datagrid/TableFiltersBar';
import HeaderUserBar from '@shared/components/common/HeaderUserBar';

type InvoiceListViewProps = {
  initialInvoices: AdminInvoiceListItem[];
  initialCatalog: AdminInvoiceCatalog;
  initialError?: string | null;
};

type InvoiceRow = AdminInvoiceListItem;

type PanelState = {
  open: boolean;
  mode: 'create' | 'edit';
  targetId: string | null;
};

const STATUS_LABELS: Record<AdminInvoiceStatus, string> = {
  paid: 'Pagada',
  pending: 'Pendiente',
  overdue: 'Vencida',
  cancelled: 'Anulada',
};

const STATUS_STYLES: Record<AdminInvoiceStatus, string> = {
  paid: 'bg-primary-50 text-primary-700 border-primary-100',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  overdue: 'bg-rose-50 text-rose-700 border-rose-100',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

const formatCurrency = (value: number) =>
  value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

const mapRecordToListItem = (record: AdminInvoiceRecord): AdminInvoiceListItem => ({
  id: record.id,
  number: record.number,
  description: record.description,
  clientId: record.clientId,
  clientName: record.clientName,
  amount: record.amount,
  subtotal: record.subtotal ?? record.amount,
  tax1: record.tax1 ?? record.taxOne?.amount ?? 0,
  tax2: record.tax2 ?? record.taxTwo?.amount ?? 0,
  vatIncluded: record.vatIncluded ?? record.includeIva ?? false,
  vatRate: record.vatRate ?? (record.vatIncluded ?? record.includeIva ? 0.19 : null),
  issuedAt: record.issuedAt,
  dueAt: record.dueAt,
  status: record.status,
  services: Array.isArray(record.details) ? record.details.length : 0,
  paymentsCount: Array.isArray(record.payments) ? record.payments.length : 0,
});

export default function InvoiceListView({
  initialInvoices,
  initialCatalog,
  initialError = null,
}: InvoiceListViewProps) {
  const { locale } = useParams() as { locale: string };
  const containerRef = useRef<HTMLDivElement>(null);

  const [invoices, setInvoices] = useState<AdminInvoiceListItem[]>(initialInvoices);
  const [catalog] = useState<AdminInvoiceCatalog>(initialCatalog);
  const [error, setError] = useState<string | null>(initialError);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [panel, setPanel] = useState<PanelState>({ open: false, mode: 'create', targetId: null });
  const [editingInvoice, setEditingInvoice] = useState<AdminInvoiceRecord | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [quickFilter, setQuickFilter] = useState('');
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const rows = useMemo<InvoiceRow[]>(() => invoices.map(invoice => ({ ...invoice })), [invoices]);

  const breadcrumbs = useMemo(
    () => [
      { label: 'Panel de Cliente', href: `/${locale}/admin/dashboard` },
      { label: 'Facturas' },
    ],
    [locale],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const payload = await getAdminInvoicesApi();
      setInvoices(payload.invoices ?? []);
      setError(null);
    } catch (refreshError: any) {
      console.error('InvoiceListView refresh error', refreshError);
      const message = refreshError instanceof Error ? refreshError.message : 'No fue posible actualizar el listado.';
      setError(message);
    } finally {
      setRefreshing(false);
    }
  };

  const openCreatePanel = () => {
    setPanel({ open: true, mode: 'create', targetId: null });
    setEditingInvoice(null);
    setSubmitting(false);
    setError(null);
  };

  const closePanel = () => {
    setPanel(prev => ({ ...prev, open: false, targetId: null }));
    setEditingInvoice(null);
    setSubmitting(false);
    setLoadingInvoice(false);
  };

  const openEditPanel = async (id: string) => {
    setPanel({ open: true, mode: 'edit', targetId: id });
    setLoadingInvoice(true);
    setSubmitting(false);
    setError(null);
    try {
      const record = await getAdminInvoiceByIdApi(id);
      if (!record) {
        setError('No encontramos la factura seleccionada.');
        closePanel();
        return;
      }
      setEditingInvoice(record);
    } catch (loadError: any) {
      console.error('InvoiceListView load error', loadError);
      const message = loadError instanceof Error ? loadError.message : 'No fue posible cargar la factura.';
      setError(message);
      closePanel();
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleCreate = async (payload: PersistAdminInvoiceInput) => {
    setSubmitting(true);
    try {
      const record = await createAdminInvoiceApi(payload);
      setInvoices((current) => {
        const mapped = mapRecordToListItem(record);
        const filtered = current.filter(invoice => invoice.id !== mapped.id);
        return [mapped, ...filtered];
      });
      setError(null);
      closePanel();
    } catch (createError: any) {
      console.error('InvoiceListView create error', createError);
      const message = createError instanceof Error ? createError.message : 'No fue posible crear la factura.';
      setError(message);
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (payload: PersistAdminInvoiceInput) => {
    if (!panel.targetId) {
      return;
    }
    setSubmitting(true);
    try {
      const record = await updateAdminInvoiceApi(panel.targetId, payload);
      setInvoices((current) => {
        const mapped = mapRecordToListItem(record);
        const filtered = current.filter(invoice => invoice.id !== mapped.id);
        return [mapped, ...filtered];
      });
      setError(null);
      closePanel();
    } catch (updateError: any) {
      console.error('InvoiceListView update error', updateError);
      const message = updateError instanceof Error ? updateError.message : 'No fue posible actualizar la factura.';
      setError(message);
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmation = window.confirm('¿Deseas eliminar esta factura? Esta acción no se puede deshacer.');
    if (!confirmation) {
      return;
    }
    try {
      await deleteAdminInvoiceApi(id);
      setInvoices(current => current.filter(invoice => invoice.id !== id));
      setError(null);
    } catch (deleteError: any) {
      console.error('InvoiceListView delete error', deleteError);
      const message = deleteError instanceof Error ? deleteError.message : 'No fue posible eliminar la factura.';
      setError(message);
    }
  };

  const columns = useMemo<ColDef<InvoiceRow>>(
    () => {
      const dateFormatter = createDateFormatter(locale);

      return [
        {
          headerName: 'Referencia',
          field: 'number',
          flex: 1.0,
          minWidth: 120,
          cellRenderer: (params: ICellRendererParams<InvoiceRow>) => (
            <Link
              href={`/${locale}/admin/invoices/${params.data.id}`}
              className="inline-flex items-center gap-2 text-left text-sm font-semibold text-primary-600 hover:underline"
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>{params.data.number}</span>
            </Link>
          ),
        },
        {
          headerName: 'Descripción',
          field: 'description',
          flex: 1.4,
          minWidth: 260,
          valueGetter: (p) => (p.data as any).description ?? '-',
        },
        {
          headerName: 'Cliente',
          field: 'clientName',
          minWidth: 200,
        },
        {
          headerName: 'Subtotal',
          field: 'subtotal',
          minWidth: 140,
          valueFormatter: params => formatCurrency((params.value as number) ?? 0),
          cellClass: 'text-center',
        },
        {
          headerName: 'Monto',
          field: 'amount',
          minWidth: 150,
          valueFormatter: params => formatCurrency(params.value as number),
        },
        {
          headerName: 'Emisión',
          field: 'issuedAt',
          minWidth: 150,
          valueFormatter: dateFormatter,
        },
        {
          headerName: 'Vencimiento',
          field: 'dueAt',
          minWidth: 150,
          valueFormatter: dateFormatter,
        },
        {
          headerName: 'Servicios',
          field: 'services',
          minWidth: 120,
          valueFormatter: params => `${params.value ?? 0}`,
          cellClass: 'text-center',
        },
        {
          headerName: 'Pagos',
          field: 'paymentsCount',
          minWidth: 100,
          valueFormatter: params => `${params.value ?? 0}`,
          cellClass: 'text-center',
          cellRenderer: (params: ICellRendererParams<InvoiceRow>) => {
            const count = params.data.paymentsCount ?? 0;
            if (count === 0) {
              return <span className="text-xs text-gray-400">0</span>;
            }
            return <span className="text-sm font-semibold text-green-600">{count}</span>;
          },
        },
        {
          headerName: 'Estado',
          field: 'status',
          minWidth: 140,
          cellRenderer: (params: ICellRendererParams<InvoiceRow>) => {
            const tone = STATUS_STYLES[params.data.status];
            return (
              <span className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>
                {STATUS_LABELS[params.data.status]}
              </span>
            );
          },
          cellClass: 'text-center',
        },
        {
          headerName: 'Acciones',
          field: 'actions',
          minWidth: 160,
          maxWidth: 180,
          pinned: 'right',
          suppressMenu: true,
          sortable: false,
          cellRenderer: (params: ICellRendererParams<InvoiceRow>) => (
            <div className="flex items-center justify-center gap-2">
              <Link
                href={`/${locale}/admin/invoices/${params.data.id}`}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(params.data.id)}
                className="inline-flex items-center justify-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ),
          cellClass: 'text-center justify-center',
        },

      ];
    },
    [locale, openEditPanel, handleDelete],
  );

  const actionButtons = (
    <div className="flex items-center gap-2">

      <button
        type="button"
        onClick={openCreatePanel}
        className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        {' '}
        Nueva factura
      </button>

    </div>
  );

  return (
    <div className="space-y-6 px-2" ref={containerRef}>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Facturas"
        description="Gestiona facturas, descargas y envíos a clientes desde un único lugar."
        actions={actionButtons}
      />

      {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={quickFilter}
              onChange={event => setQuickFilter(event.target.value)}
              placeholder="Buscar factura…"
              className="w-full rounded-full border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <AgTable<InvoiceRow>
            rows={rows}
            columns={columns}
            quickFilterText={quickFilter}
            getRowId={data => data.id}
            height={520}
            enableColumnFilters={true}
            onReady={api => setGridApi(api)}
          />
        </div>
      </div>

      <SidePanel
        title={panel.mode === 'create' ? 'Crear factura' : 'Editar factura'}
        open={panel.open}
        onClose={closePanel}
      >
        <div className="px-5 py-6">
          {panel.mode === 'edit' && loadingInvoice
            ? (
                <p className="text-sm text-gray-500">Cargando factura…</p>
              )
            : (
                <InvoiceForm
                  catalog={catalog}
                  variant={panel.mode === 'create' ? 'create' : 'edit'}
                  defaultValue={panel.mode === 'edit' ? editingInvoice : null}
                  submitting={submitting}
                  onSubmit={panel.mode === 'create' ? handleCreate : handleEditSubmit}
                  onCancel={closePanel}
                />
              )}
        </div>
      </SidePanel>
    </div>
  );
}

