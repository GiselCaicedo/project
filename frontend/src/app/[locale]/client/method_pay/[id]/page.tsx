import PaymentMethodDetailView from '@app/modules/client/payments/components/PaymentMethodDetailView';
import { cookies } from 'next/headers';
import { getClientPaymentMethodByIdApi } from '@shared/services/conexion';

export default async function ClientPaymentMethodDetailPage(
  props: { params: Promise<{ locale: string; id: string }> },
) {
  const { locale, id } = await props.params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  let method = null as Awaited<ReturnType<typeof getClientPaymentMethodByIdApi>>;
  let error: string | null = null;

  if (!id) {
    error = 'Identificador de método de pago inválido.';
  } else {
    try {
      method = await getClientPaymentMethodByIdApi(id, token ?? undefined);
      if (!method) {
        error = 'No se encontró el método de pago solicitado.';
      }
    } catch (e: any) {
      error = e?.message ?? 'No fue posible cargar la información del método de pago.';
    }
  }

  return (
    <div className="px-6 py-8 lg:px-8">
      <PaymentMethodDetailView method={method} errorMessage={error} locale={locale} />
    </div>
  );
}
