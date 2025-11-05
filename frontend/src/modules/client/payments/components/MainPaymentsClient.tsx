'use client';

import type { ClientPaymentSummary, PaymentFormValues, PaymentMethodSummary, InvoiceForPayment } from '@app/modules/client/payments/types';
import type { ColDef } from 'ag-grid-community';
import PageHeader from '@shared/components/common/PageHeader';
import AgTable from '@shared/components/datagrid/AgTable';
import { createDateFormatter } from '@shared/utils/columnFormatters';
import { ArrowUpRight, FileText, Eye, Plus } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState, useCallback } from 'react';
import SidePanel from '@shared/components/common/SidePanel';
import PaymentFormDrawer from './PaymentFormDrawer';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : '');

export default function MainPaymentsClient({ payments, errorMessage }: { payments: ClientPaymentSummary[]; errorMessage: string | null }) {
  const params = useParams<{ locale?: string }>();
  const router = useRouter();
  const locale = typeof params?.locale === 'string' ? params.locale : 'es';
  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Pagos' },
  ];

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [methods, setMethods] = useState<PaymentMethodSummary[]>([]);
  const [invoices, setInvoices] = useState<InvoiceForPayment[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const loadPaymentData = useCallback(async () => {
    setIsLoadingData(true);
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
        setInvoices(invoicesData.data?.invoices || []);
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
      toast.error('Error al cargar los datos del formulario');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const handleOpenDrawer = async () => {
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

      toast.success('Pago creado exitosamente');
      router.refresh();
      setDrawerOpen(false);
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error(error.message || 'Error al crear el pago');
      throw error;
    }
  };

  const columns: ColDef<ClientPaymentSummary>[] = useMemo(() => {
    const dateFormatter = createDateFormatter();

    return [
      { headerName: 'Código', field: 'code', minWidth: 50 },
      { headerName: 'Valor', field: 'value', valueFormatter: (p: any) => formatCurrency(p.value), minWidth: 130, cellClass: 'text-center justify-center' },
      { headerName: 'Tipo', field: 'type', cellClass: 'text-center justify-center', minWidth: 100 },
      { headerName: 'Método', field: 'payment_method', valueGetter: (p: any) => p.data?.payment_method?.name ?? '-', minWidth: 160 },
      {
        headerName: 'Consecutivo Facturación',
        field: 'invoice_consecutive',
        minWidth: 180,
        cellRenderer: (p: any) => {
          const consecutive = p.data?.invoice_consecutive;
          if (!consecutive) {
            return <span className="text-xs text-gray-400">Sin factura</span>;
          }
          return <span className="text-sm font-medium text-blue-600">{consecutive}</span>;
        }
      },
      { headerName: 'Estado', field: 'status_pay', minWidth: 120, cellClass: 'text-center justify-center' },
      { headerName: 'Fecha', field: 'created', valueFormatter: dateFormatter, minWidth: 140, cellClass: 'text-center justify-center' },
      {
        headerName: 'Acciones',
        field: 'id' as any,
        minWidth: 120,
        maxWidth: 140,
        cellClass: 'text-center justify-center',
        sortable: false,
        filter: false,
        pinned: 'right',
        cellRenderer: (params: any) => {
          const payment = params.data;
          if (!payment) {
            return '-';
          }

          return (
            <div className="flex items-center justify-center gap-1">
              {payment.url && (
                <a
                  href={payment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-md p-1.5 text-blue-600 transition hover:bg-blue-50"
                  title="Ver comprobante"
                >
                  <FileText className="h-4 w-4" />
                </a>
              )}
              <Link
                href={`/${locale}/client/payments/${payment.id}`}
                className="inline-flex items-center justify-center rounded-md p-1.5 text-primary-600 transition hover:bg-primary-50"
                title="Ver detalle"
              >
                <Eye className="h-4 w-4" />
              </Link>
            </div>
          );
        },
      },
    ];
  }, [locale]);

  return (
    <div>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Pagos"
        description="Historial y estado de tus pagos."
        actions={
          <button
            onClick={handleOpenDrawer}
            disabled={isLoadingData}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            <Plus className="h-4 w-4" />
            {isLoadingData ? 'Cargando...' : 'Crear Pago'}
          </button>
        }
      />
      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}
      <AgTable<ClientPaymentSummary>
        rows={payments}
        columns={columns}
        getRowId={r => r.id}
        height={520}
        pageSize={payments.length > 10 ? 10 : payments.length || 10}
      />

      <SidePanel title="Crear nuevo pago" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <PaymentFormDrawer
          open={drawerOpen}
          submitLabel="Crear pago"
          methods={methods}
          invoices={invoices}
          onSubmit={handleSubmitPayment}
          onClose={() => setDrawerOpen(false)}
        />
      </SidePanel>
    </div>
  );
}

const formatCurrency = (value?: string | null) => {
  if (!value) {
    return '-';
  }
  const num = Number(value);
  if (Number.isNaN(num)) {
    return value;
  }
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
};
