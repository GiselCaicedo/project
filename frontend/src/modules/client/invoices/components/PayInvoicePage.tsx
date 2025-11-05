'use client';

import type { PaymentFormValues, PaymentMethodSummary, InvoiceForPayment } from '@app/modules/client/payments/types';
import PageHeader from '@shared/components/common/PageHeader';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import SidePanel from '@shared/components/common/SidePanel';
import PaymentFormDrawer from '../../payments/components/PaymentFormDrawer';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : '');

type Props = {
  locale: string;
  invoiceId: string;
};

export default function PayInvoicePage({ locale, invoiceId }: Props) {
  const router = useRouter();
  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Facturas', href: `/${locale}/client/invoices` },
    { label: 'Pagar factura' },
  ];

  const [isLoading, setIsLoading] = useState(true);
  const [methods, setMethods] = useState<PaymentMethodSummary[]>([]);
  const [invoices, setInvoices] = useState<InvoiceForPayment[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceForPayment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadPaymentData = useCallback(async () => {
    setIsLoading(true);
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
        const invoicesList = invoicesData.data?.invoices || [];
        setInvoices(invoicesList);

        // Buscar la factura específica
        const invoice = invoicesList.find((inv: InvoiceForPayment) => inv.id === invoiceId);
        if (invoice) {
          setSelectedInvoice(invoice);
          setDrawerOpen(true);
        } else {
          toast.error('Factura no encontrada');
          router.push(`/${locale}/client/invoices`);
        }
      }
    } catch (error) {
      console.error('Error loading payment data:', error);
      toast.error('Error al cargar los datos del formulario');
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId, router, locale]);

  useEffect(() => {
    loadPaymentData();
  }, [loadPaymentData]);

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
      router.push(`/${locale}/client/payments`);
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error(error.message || 'Error al crear el pago');
      throw error;
    }
  };

  const handleClose = () => {
    router.push(`/${locale}/client/invoices`);
  };

  if (isLoading) {
    return (
      <div className="px-6 py-8 lg:px-8">
        <PageHeader
          breadcrumbs={breadcrumbs}
          title="Pagar Factura"
          description="Realiza el pago de tu factura"
        />
        <div className="mt-6 flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600">Cargando datos del pago...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 lg:px-8">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Pagar Factura"
        description={selectedInvoice ? `Pagar factura ${selectedInvoice.code || 'sin código'}` : 'Realiza el pago de tu factura'}
      />

      {selectedInvoice && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-base font-semibold text-gray-900">Detalles de la factura</h3>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Código</dt>
              <dd className="mt-1 text-sm text-gray-900">{selectedInvoice.code || 'Sin código'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Valor</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">{formatCurrency(selectedInvoice.value)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Estado</dt>
              <dd className="mt-1 text-sm text-gray-900">{selectedInvoice.status_pay || 'Sin estado'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Fecha de emisión</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {selectedInvoice.created ? new Date(selectedInvoice.created).toLocaleDateString('es-CO') : 'Sin fecha'}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <SidePanel title="Registrar pago" open={drawerOpen} onClose={handleClose}>
        <PaymentFormDrawer
          open={drawerOpen}
          title="Registrar pago de factura"
          submitLabel="Registrar pago"
          methods={methods}
          invoices={invoices}
          onSubmit={handleSubmitPayment}
          onClose={handleClose}
          defaultInvoiceId={invoiceId}
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
