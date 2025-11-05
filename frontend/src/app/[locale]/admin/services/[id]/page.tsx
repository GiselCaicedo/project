import ServiceDetailPageView from '@admin/services/components/ServiceDetailPageView';
import { getAdminServiceDetailApi } from '@shared/services/conexion';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

export default async function ServiceDetailPage(props: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await props.params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    notFound();
  }

  try {
    const detail = await getAdminServiceDetailApi(id, token);
    if (!detail) {
      notFound();
    }

    return (
      <div className="  lg:px-8">
        <div className="mx-auto w-full space-y-6">
          <ServiceDetailPageView initialService={detail} locale={locale} serviceId={id} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to load service detail', error);
    notFound();
  }
}
