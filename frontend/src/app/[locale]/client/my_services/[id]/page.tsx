import ServiceDetailView from '@app/modules/client/my-services/components/ServiceDetailView';
import { getClientServiceDetailApi } from '@shared/services/conexion';
import { cookies } from 'next/headers';
import { cache } from 'react';

// Cache the service detail fetch to prevent duplicate requests during render
const getCachedServiceDetail = cache(async (id: string, token?: string) => {
  return getClientServiceDetailApi(id, token);
});

export default async function ClientServiceDetailPage(
  props: { params: Promise<{ locale: string; id: string }> },
) {
  const { locale, id } = await props.params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  let service = null as Awaited<ReturnType<typeof getClientServiceDetailApi>>;
  let error: string | null = null;

  if (!id) {
    error = 'Identificador de servicio inválido.';
  } else {
    try {
      service = await getCachedServiceDetail(id, token ?? undefined);
      if (!service) {
        error = 'No se encontró el servicio solicitado.';
      }
    } catch (e: any) {
      error = e?.message ?? 'No fue posible cargar la información del servicio.';
    }
  }

  return (
    <div className="space-y-6 p-6">
      <ServiceDetailView service={service} errorMessage={error} locale={locale} />
    </div>
  );
}
