import type { ServiceRequestRecord } from '@admin/services/requests/types';
import ServiceRequestsListView from '@admin/services/requests/ServiceRequestsListView';
import { getAdminServiceRequestsApi } from '@shared/services/conexion';
import { cookies } from 'next/headers';

export default async function AdminServiceRequestsPage(props: { params: Promise<{ locale: string }> }) {
  await props.params; // mantener compatibilidad con el layout

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  let requests: ServiceRequestRecord[] = [];
  let error: string | null = null;

  try {
    requests = await getAdminServiceRequestsApi(token);
  } catch (e: any) {
    error = e?.message ?? 'No fue posible cargar las solicitudes de servicios';
  }

  return (
    <div className="space-y-6 lg:px-8">
      <ServiceRequestsListView initialRequests={requests} initialError={error} />
    </div>
  );
}
