import MainInvoicesClient from '@app/modules/client/invoices/components/MainInvoicesClient';
import { getClientInvoicesListApi } from '@shared/services/conexion';
import { cookies } from 'next/headers';

export default async function ClientInvoicePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  void locale;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  let invoices = [] as Awaited<ReturnType<typeof getClientInvoicesListApi>>['invoices'];
  let error: string | null = null;
  try {
    const payload = await getClientInvoicesListApi(token);
    invoices = payload.invoices ?? [];
  } catch (e: any) {
    error = e?.message ?? 'No fue posible cargar facturas';
  }
  return (
    <div className="px-6 py-8 lg:px-8">
      <MainInvoicesClient invoices={invoices} errorMessage={error} />
    </div>
  );
}
