import PaymentDetailView from '@app/modules/client/payments/components/PaymentDetailView';
import { getClientPaymentDetailApi } from '@shared/services/conexion';
import { cookies } from 'next/headers';

export default async function ClientPaymentDetailPage(
  props: { params: Promise<{ locale: string; id: string }> },
) {
  const { locale, id } = await props.params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  let payment = null as Awaited<ReturnType<typeof getClientPaymentDetailApi>>;
  let error: string | null = null;

  if (!id) {
    error = 'Identificador de pago inválido.';
  } else {
    try {
      payment = await getClientPaymentDetailApi(id, token ?? undefined);
      if (!payment) {
        error = 'No se encontró el pago solicitado.';
      }
    } catch (e: any) {
      error = e?.message ?? 'No fue posible cargar la información del pago.';
    }
  }

  return (
    <div className="px-6 py-8 lg:px-8">
      <PaymentDetailView payment={payment} errorMessage={error} locale={locale} />
    </div>
  );
}
