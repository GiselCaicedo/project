import ServiceDetailView from '@app/modules/client/services/components/ServiceDetailView';
import { cookies } from 'next/headers';
import { getClientServiceDetailApi } from '@shared/services/conexion';

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
      service = await getClientServiceDetailApi(id, token ?? undefined);
      if (!service) {
        error = 'No se encontró el servicio solicitado.';
      }
    } catch (e: any) {
      error = e?.message ?? 'No fue posible cargar la información del servicio.';
    }
  }

  return (
    <div className="px-6 py-8 lg:px-8">
      <ServiceDetailView service={service} errorMessage={error} locale={locale} />
    </div>
  );
}
