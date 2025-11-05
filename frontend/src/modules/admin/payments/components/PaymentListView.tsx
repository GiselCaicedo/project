'use client';

import type { AdminPaymentMutationResult } from '@shared/services/conexion';
import type { AdminInvoiceListItem } from '@admin/data/invoices';
import type { ColDef, GridApi, ICellRendererParams } from 'ag-grid-community';
import type {
  PaymentClient,
  PaymentFormValues,
  PaymentMethod,
  PaymentRecord,
} from './types';
import PageHeader from '@app/shared/components/common/PageHeader';
import SidePanel from '@shared/components/common/SidePanel';
import AgTable from '@shared/components/datagrid/AgTable';
import {

  createAdminPaymentApi,
  deleteAdminPaymentApi,
  updateAdminPaymentApi,
} from '@shared/services/conexion';
import { createDateFormatter, fallbackFormatter } from '@shared/utils/columnFormatters';
import { CreditCard, Paperclip, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import DeletePaymentModal from './DeletePaymentModal';
import PaymentFormDrawer from './PaymentFormDrawer';
import TableFiltersBar from '@shared/components/datagrid/TableFiltersBar';
import HeaderUserBar from '@shared/components/common/HeaderUserBar';

type PaymentListViewProps = {
  initialPayments: PaymentRecord[];
  initialClients: PaymentClient[];
  initialMethods: PaymentMethod[];
  initialInvoices: AdminInvoiceListItem[];
  initialError?: string | null;
};

type PaymentRow = PaymentRecord & {
  attachmentsCount: number;
  invoicesInfo: string;
};

const clonePayment = (payment: PaymentRecord): PaymentRecord => ({
  ...payment,
  attachments: Array.isArray(payment.attachments)
    ? payment.attachments.map(attachment => ({ ...attachment }))
    : [],
});

const formatDate = (value: string | null | undefined, locale: string) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
};

const statusTone: Record<PaymentRecord['status'], { label: string; tone: string }> = {
  pagado: { label: 'Pagado', tone: 'bg-primary-100 text-primary-700' },
  pendiente: { label: 'Pendiente', tone: 'bg-amber-100 text-amber-700' },
  anulado: { label: 'Anulado', tone: 'bg-gray-200 text-gray-700' },
  fallido: { label: 'Fallido', tone: 'bg-red-100 text-red-700' },
  otro: { label: 'Sin estado', tone: 'bg-gray-100 text-gray-600' },
};

const formatAmount = (payment: PaymentRecord, locale: string) => {
  if (payment.amountRaw && payment.amountRaw.trim().length > 0) {
    return payment.amountRaw;
  }
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(payment.amount ?? 0);
};

export default function PaymentListView({
  initialPayments,
  initialClients,
  initialMethods,
  initialInvoices,
  initialError = null,
}: PaymentListViewProps) {
  const { locale } = useParams() as { locale: string };
  const [payments, setPayments] = useState<PaymentRecord[]>(() => initialPayments.map(clonePayment));
  const [clients] = useState<PaymentClient[]>(() => initialClients.map(client => ({ ...client })));
  const [methods, setMethods] = useState<PaymentMethod[]>(() => initialMethods.map(method => ({ ...method })));
  const [invoices] = useState(() =>
    initialInvoices
      .filter(invoice => invoice.status === 'paid' || invoice.status === 'pending')
      .map(invoice => ({
        id: invoice.id,
        clientId: invoice.clientId,
        number: invoice.number,
        amount: invoice.amount,
        status: invoice.status,
      }))
  );
  const [quickFilter, setQuickFilter] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<PaymentRecord | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentRecord | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const rows: PaymentRow[] = useMemo(
    () =>
      payments.map(payment => {
        const attachments = Array.isArray(payment.attachments) ? payment.attachments : [];
        const invoicesInfo = attachments
          .filter(att => att.invoiceNumber)
          .map(att => att.invoiceNumber)
          .join(', ');

        return {
          ...payment,
          attachmentsCount: attachments.length,
          invoicesInfo: invoicesInfo || '-',
        };
      }),
    [payments],
  );

  const breadcrumbs = useMemo(
    () => [
      { label: 'Panel de Cliente', href: `/${locale}/admin/dashboard` },
      { label: 'Pagos' },
    ],
    [locale],
  );

  const handleMutationSuccess = (result: AdminPaymentMutationResult) => {
    setPayments((prev) => {
      const existingIndex = prev.findIndex(payment => payment.id === result.payment.id);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = clonePayment(result.payment);
        return next;
      }
      return [...prev, clonePayment(result.payment)];
    });
    setMethods(result.methods.map(method => ({ ...method })));
    setErrorMessage(null);
  };

  const handleCreatePayment = async (values: PaymentFormValues) => {
    try {
      const result = await createAdminPaymentApi(values);
      handleMutationSuccess(result);
    } catch (error: any) {
      console.error('Failed to create payment', error);
      const message = error instanceof Error ? error.message : 'No fue posible registrar el pago.';
      setErrorMessage(message);
      throw error instanceof Error ? error : new Error(message);
    }
  };

  const handleUpdatePayment = async (values: PaymentFormValues) => {
    if (!paymentToEdit) {
      return;
    }
    try {
      const result = await updateAdminPaymentApi(paymentToEdit.id, values);
      handleMutationSuccess(result);
    } catch (error: any) {
      console.error('Failed to update payment', error);
      const message = error instanceof Error ? error.message : 'No fue posible actualizar el pago.';
      setErrorMessage(message);
      throw error instanceof Error ? error : new Error(message);
    }
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) {
      return;
    }
    try {
      await deleteAdminPaymentApi(paymentToDelete.id);
      setPayments(prev => prev.filter(payment => payment.id !== paymentToDelete.id));
      setPaymentToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete payment', error);
      const message = error instanceof Error ? error.message : 'No fue posible eliminar el pago.';
      setErrorMessage(message);
      throw error instanceof Error ? error : new Error(message);
    }
  };

  const columns = useMemo<ColDef<PaymentRow>[]>(() => {
    const dateFormatter = createDateFormatter(locale);

    const base: ColDef<PaymentRow>[] = [
      {
        headerName: 'Cliente',
        field: 'clientName',
        minWidth: 100,
        flex: 1.2,
        cellRenderer: (params: ICellRendererParams<PaymentRow>) => (
          <div className="flex items-center gap-2 text-sm font-semibold text-primary-700">
            <CreditCard className="h-4 w-4" />
            <span>{params.data.clientName}</span>
          </div>
        ),
      },
      {
        headerName: 'Fecha',
        field: 'updatedAt',
        minWidth: 140,
        valueFormatter: dateFormatter,
      },
      {
        headerName: 'Valor',
        field: 'amount',
        minWidth: 140,
        cellRenderer: (params: ICellRendererParams<PaymentRow>) => {
          if (!params.data) {
            return '—';
          }
          return formatAmount(params.data, locale);
        },
      },
      {
        headerName: 'Estado',
        field: 'status',
        minWidth: 140,
        cellRenderer: (params: ICellRendererParams<PaymentRow>) => {
          const config = statusTone[params.data.status] ?? statusTone.otro;
          return (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${config.tone}`}>
              {config.label}
            </span>
          );
        },
      },
      {
        headerName: 'Método',
        field: 'methodName',
        minWidth: 160,
        flex: 1,
        valueFormatter: fallbackFormatter,
      },
      {
        headerName: 'Anexos',
        field: 'attachmentsCount',
        minWidth: 120,
        cellRenderer: (params: ICellRendererParams<PaymentRow>) => (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Paperclip className="h-4 w-4" />
            <span>{params.data.attachmentsCount}</span>
          </div>
        ),
        cellClass: 'text-center justify-center',
      },
      {
        headerName: 'Consecutivo Facturación',
        field: 'invoicesInfo',
        minWidth: 200,
        flex: 1,
        cellRenderer: (params: ICellRendererParams<PaymentRow>) => {
          if (!params.data || !params.data.invoicesInfo || params.data.invoicesInfo === '-') {
            return <span className="text-xs text-gray-400">Sin facturas</span>;
          }
          return (
            <span className="text-sm font-medium text-blue-600">
              {params.data.invoicesInfo}
            </span>
          );
        },
      },
    ];

    const actions: ColDef<PaymentRow> = {
      headerName: 'Acciones',
      field: 'actions',
      minWidth: 160,
      maxWidth: 180,
      pinned: 'right',
      suppressMenu: true,
      sortable: false,
      cellRenderer: (params: ICellRendererParams<PaymentRow>) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPaymentToEdit(clonePayment(params.data));
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
          >
            <Pencil className="h-3.5 w-3.5" />
            {' '}
          </button>
          <button
            type="button"
            onClick={() => setPaymentToDelete(clonePayment(params.data))}
            className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {' '}
          </button>
        </div>
      ),
      cellClass: 'text-center justify-center',
    };

    return [...base, actions];
  }, [locale]);

  const handleSubmit = async (values: PaymentFormValues) => {
    if (paymentToEdit) {
      await handleUpdatePayment(values);
    } else {
      await handleCreatePayment(values);
    }
    setPaymentToEdit(null);
    setIsFormOpen(false);
  };

  const formTitle = paymentToEdit ? 'Editar pago' : 'Registrar pago';
  const formSubmitLabel = paymentToEdit ? 'Guardar cambios' : 'Guardar pago';

  const actionButtons = (
    <div className="flex items-center gap-2">

      <button
        type="button"
        onClick={() => setIsFormOpen(true)}
        className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        {' '}
        Registrar Pago
      </button>
    </div>
  );

  return (
    <div className="space-y-6" ref={containerRef}>

      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Pagos"
        description="Gestiona facturas, descargas y envíos a clientes desde un único lugar."
        actions={actionButtons}
      />

      {errorMessage
        ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
          )
        : null}

      <div>
        <div className="mb-3">
          <TableFiltersBar
            value={quickFilter}
            onChange={setQuickFilter}
            onClear={() => {
              setQuickFilter('');
              gridApi?.setFilterModel(null);
            }}
            placeholder="Buscar pago..."
            rightActions={(
              <button
                type="button"
                onClick={() => {
                  setQuickFilter('');
                  gridApi?.setFilterModel(null);
                }}
                className="inline-flex items-center rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Limpiar filtros
              </button>
            )}
          />
        </div>
        <AgTable<PaymentRow>
          rows={rows}
          columns={columns}
          quickFilterText={quickFilter}
          getRowId={data => data.id}
          height={520}
          enableColumnFilters={true}
          onReady={api => setGridApi(api)}
        />
      </div>

      <SidePanel
        open={isFormOpen}
        title={formTitle}
        onClose={() => {
          setIsFormOpen(false);
          setPaymentToEdit(null);
        }}
      >
        <PaymentFormDrawer
          open={isFormOpen}
          title={formTitle}
          submitLabel={formSubmitLabel}
          clients={clients}
          methods={methods}
          invoices={invoices}
          onSubmit={handleSubmit}
          onClose={() => {
            setIsFormOpen(false);
            setPaymentToEdit(null);
          }}
          defaultValues={paymentToEdit}
        />
      </SidePanel>

      <DeletePaymentModal
        open={Boolean(paymentToDelete)}
        paymentLabel={paymentToDelete?.reference ?? paymentToDelete?.clientName ?? null}
        onConfirm={handleDeletePayment}
        onClose={() => setPaymentToDelete(null)}
      />
    </div>
  );
}

