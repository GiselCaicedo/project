import InvoiceDetailView from '@app/modules/client/invoices/components/InvoiceDetailView';
import { getClientInvoiceDetailApi } from '@shared/services/conexion';
import { cookies } from 'next/headers';

export default async function ClientInvoiceDetailPage(
  props: { params: Promise<{ locale: string; id: string }> },
) {
  const { locale, id } = await props.params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  let invoice = null as Awaited<ReturnType<typeof getClientInvoiceDetailApi>>;
  let error: string | null = null;

  if (!id) {
    error = 'Identificador de factura inválido.';
  } else {
    try {
      invoice = await getClientInvoiceDetailApi(id, token ?? undefined);
      if (!invoice) {
        error = 'No se encontró la factura solicitada.';
      }
    } catch (e: any) {
      error = e?.message ?? 'No fue posible cargar la información de la factura.';
    }
  }

  return (
    <div className="px-6 py-8 lg:px-8">
      <InvoiceDetailView invoice={invoice} errorMessage={error} locale={locale} />
    </div>
  );
}
