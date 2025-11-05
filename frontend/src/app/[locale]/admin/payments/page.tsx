import type { PaymentClient, PaymentMethod, PaymentRecord } from '@admin/payments/types';
import type { AdminInvoiceListItem } from '@admin/data/invoices';
import type { Metadata } from 'next';
import PaymentListView from '@admin/payments/components/PaymentListView';
import { getAdminPaymentsListApi, getAdminInvoicesApi } from '@shared/services/conexion';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Pagos',
  });

  return {
    title: t('meta_title'),
  };
}

export default async function PagosPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  void locale;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  let payments: PaymentRecord[] = [];
  let clients: PaymentClient[] = [];
  let methods: PaymentMethod[] = [];
  let invoices: AdminInvoiceListItem[] = [];
  let error: string | null = null;

  if (!token) {
    error = 'No se encontró una sesión activa.';
  } else {
    try {
      const [paymentsPayload, invoicesPayload] = await Promise.all([
        getAdminPaymentsListApi(token),
        getAdminInvoicesApi(token),
      ]);
      payments = Array.isArray(paymentsPayload.payments) ? paymentsPayload.payments : [];
      clients = Array.isArray(paymentsPayload.clients) ? paymentsPayload.clients : [];
      methods = Array.isArray(paymentsPayload.methods) ? paymentsPayload.methods : [];
      invoices = Array.isArray(invoicesPayload.invoices) ? invoicesPayload.invoices : [];
    } catch (err) {
      console.error('Failed to load payments list', err);
      error = err instanceof Error ? err.message : 'No fue posible cargar los pagos.';
    }
  }

  return (
    <div className="lg:px-8">
      <div className="mx-auto w-full space-y-6">
        <PaymentListView
          initialPayments={payments}
          initialClients={clients}
          initialMethods={methods}
          initialInvoices={invoices}
          initialError={error}
        />
      </div>
    </div>
  );
}
