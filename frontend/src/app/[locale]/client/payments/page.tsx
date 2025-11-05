import MainPaymentsClient from '@app/modules/client/payments/components/MainPaymentsClient';
import { getClientPaymentsListApi } from '@shared/services/conexion';
import { cookies } from 'next/headers';

export default async function ClientPaymentPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  void locale;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  let payments = [] as Awaited<ReturnType<typeof getClientPaymentsListApi>>['payments'];
  let error: string | null = null;
  try {
    const payload = await getClientPaymentsListApi(token);
    payments = payload.payments ?? [];
  } catch (e: any) {
    error = e?.message ?? 'No fue posible cargar pagos';
  }
  return (
    <div className="px-6 py-8 lg:px-8">
      <MainPaymentsClient payments={payments} errorMessage={error} />
    </div>
  );
}
