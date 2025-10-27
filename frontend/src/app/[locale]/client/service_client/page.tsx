import MainServicesClient from '@app/modules/client/my-services/components/MainServicesClient'
import { cookies } from 'next/headers'
import { getClientServicesListApi } from '@shared/services/conexion'

export default async function ServiceClientDashboard(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  void locale;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  let services = [] as Awaited<ReturnType<typeof getClientServicesListApi>>['services'];
  let error: string | null = null;
  try {
    const payload = await getClientServicesListApi(token);
    services = payload.services ?? [];
  } catch (e: any) {
    error = e?.message ?? 'No fue posible cargar servicios';
  }
  return (
    <div>
      <MainServicesClient services={services} errorMessage={error} />
    </div>
  )
}
