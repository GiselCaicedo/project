import ServiceRequestsListClient from '@app/modules/client/my-services/components/ServiceRequestsListClient';
import { getClientServiceRequestsApi } from '@shared/services/conexion';
import { cookies } from 'next/headers';

export default async function ClientServiceRequestsPage(props: { params: Promise<{ locale: string }> }) {
  await props.params; // compatibilidad con layout

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  let requests = [] as Awaited<ReturnType<typeof getClientServiceRequestsApi>>;
  let error: string | null = null;

  try {
    requests = await getClientServiceRequestsApi(token);
  } catch (e: any) {
    error = e?.message ?? 'No fue posible cargar tus solicitudes';
  }

  return (
    <div className="space-y-6 lg:px-8">
      <ServiceRequestsListClient initialRequests={requests} initialError={error} />
    </div>
  );
}
