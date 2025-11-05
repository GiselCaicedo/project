'use client';

import type { ClientInvoiceSummary } from '@app/modules/client/invoices/types';
import type { PaymentFormValues, PaymentMethodSummary, InvoiceForPayment } from '@app/modules/client/payments/types';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import PageHeader from '@shared/components/common/PageHeader';
import AgTable from '@shared/components/datagrid/AgTable';
import { downloadClientInvoiceArtifactApi } from '@shared/services/conexion';
import { createDateFormatter } from '@shared/utils/columnFormatters';
import { CreditCard, Download, Eye } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState, useCallback } from 'react';
import SidePanel from '@shared/components/common/SidePanel';
import PaymentFormDrawer from '../../payments/components/PaymentFormDrawer';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : '');

export default function MainInvoicesClient({ invoices, errorMessage }: { invoices: ClientInvoiceSummary[]; errorMessage: string | null }) {
  const params = useParams<{ locale?: string }>();
  const router = useRouter();
  const locale = typeof params?.locale === 'string' ? params.locale : 'es';
  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Facturas' },
  ];
  const { notify } = useAlerts();
  const [rowsState, setRowsState] = useState<ClientInvoiceSummary[]>(invoices);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Payment drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [methods, setMethods] = useState<PaymentMethodSummary[]>([]);
  const [invoicesForPayment, setInvoicesForPayment] = useState<InvoiceForPayment[]>([]);
  const [isLoadingPaymentData, setIsLoadingPaymentData] = useState(false);

  const loadPaymentData = useCallback(async () => {
    setIsLoadingPaymentData(true);
    try {
      const [methodsRes, invoicesRes] = await Promise.all([
        fetch(`${API_URL}/client/payments/methods`, { credentials: 'include' }),
        fetch(`${API_URL}/client/payments/invoices`, { credentials: 'include' }),
      ]);

      if (methodsRes.ok) {
        const methodsData = await methodsRes.json();
        setMethods(methodsData.data?.methods || []);
      }

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        // El backend ya filtra solo facturas aprobadas
        setInvoicesForPayment(invoicesData.data?.invoices || []);
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
      toast.error('Error al cargar los datos del formulario');
    } finally {
      setIsLoadingPaymentData(false);
    }
  }, []);

  const handleOpenPaymentDrawer = async (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    await loadPaymentData();
    setDrawerOpen(true);
  };

  const handleSubmitPayment = async (values: PaymentFormValues) => {
    try {
      const response = await fetch(`${API_URL}/client/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el pago');
      }

      toast.success('Pago registrado exitosamente');
      router.refresh();
      setDrawerOpen(false);
      setSelectedInvoiceId(null);
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error(error.message || 'Error al crear el pago');
      throw error;
    }
  };

  const columns: ColDef<ClientInvoiceSummary>[] = useMemo(() => {
    const dateFormatter = createDateFormatter();

    return [
      { headerName: 'Fecha', field: 'created', valueFormatter: dateFormatter, minWidth: 50, maxWidth: 100, cellClass: 'text-center justify-center' },
      { headerName: 'N° Factura', field: 'consecutive', minWidth: 160, flex: 1 },
      { headerName: 'Descripción', field: 'description', flex: 1.2, minWidth: 200 },
      { headerName: 'Valor', field: 'total', valueFormatter: p => formatCurrency(p.value), minWidth: 130, cellClass: 'text-right justify-end' },
      {
        headerName: 'Estado',
        field: 'expiry',
        minWidth: 80,
        maxWidth: 100,
        cellClass: 'text-center justify-center',
        cellRenderer: (p: ICellRendererParams<ClientInvoiceSummary>) => {
          const expiry = p.data?.expiry ? new Date(p.data.expiry) : null;
          const isOverdue = expiry ? expiry.getTime() < Date.now() : false;
          const label = isOverdue ? 'Vencida' : 'Pendiente';
          const tone = isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';
          return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{label}</span>;
        },
      },
      {
        headerName: 'Documentos',
        field: 'id',
        minWidth: 150,
        cellClass: 'text-center justify-center',
        sortable: false,
        filter: false,
        cellRenderer: (p: ICellRendererParams<ClientInvoiceSummary>) => {
          const id = p.data?.id; if (!id) {
            return '-';
          } const busy = downloadingId === id;
          return (
            <button
              type="button"
              onClick={async () => {
                setDownloadingId(id); try {
                  const blob = await downloadClientInvoiceArtifactApi(id, 'pdf'); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${p.data?.consecutive ?? p.data?.description ?? 'factura'}.pdf`; a.click(); URL.revokeObjectURL(url);
                } catch (e) {
                  console.error(e); notify({ type: 'error', title: 'No fue posible descargar el PDF' });
                } finally {
                  setDownloadingId(null);
                }
              }}
              className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              disabled={busy}
            >
              <Download className={`mr-1 h-3.5 w-3.5 ${busy ? 'animate-bounce' : ''}`} />
              {' '}
              PDF
            </button>
          );
        },
      },

      {
        headerName: 'Acciones',
        field: 'actions',
        minWidth: 160,
        maxWidth: 180,
        cellClass: 'text-center justify-center',
        sortable: false,
        filter: false,
        pinned: 'right',
        cellRenderer: (p: ICellRendererParams<ClientInvoiceSummary>) => {
          const invoiceId = p.data?.id; if (!invoiceId) {
            return '-';
          }
          return (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenPaymentDrawer(invoiceId)}
                className="inline-flex items-center rounded-lg border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
              >
                <CreditCard className="mr-1 h-3.5 w-3.5" />
                Pagar
              </button>
              <Link href={`/${locale}/client/invoices/${invoiceId}`} className="inline-flex items-center justify-center rounded-md p-1.5 text-primary-600 transition hover:bg-primary-50" title="Ver detalle">
                <Eye className="h-4 w-4" />
              </Link>
            </div>
          );
        },
      },
    ];
  }, [locale, downloadingId, notify, handleOpenPaymentDrawer]);

  return (
    <div className="space-y-6">
      <PageHeader breadcrumbs={breadcrumbs} title="Facturas" description="Revisa tus facturas emitidas y su estado." />
      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}
      <AgTable<ClientInvoiceSummary>
        rows={rowsState}
        columns={columns}
        getRowId={r => r.id}
        height={520}
        pageSize={rowsState.length > 10 ? 10 : rowsState.length || 10}
      />

      <SidePanel title="Registrar pago" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <PaymentFormDrawer
          open={drawerOpen}
          submitLabel="Registrar pago"
          methods={methods}
          invoices={invoicesForPayment}
          onSubmit={handleSubmitPayment}
          onClose={() => setDrawerOpen(false)}
          defaultInvoiceId={selectedInvoiceId}
        />
      </SidePanel>
    </div>
  );
}

const formatCurrency = (value?: number | null) => {
  if (value == null) {
    return '-';
  }
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};
