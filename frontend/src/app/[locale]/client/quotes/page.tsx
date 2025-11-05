import MainQuotesClient from '@app/modules/client/quotes/components/MainQuotesClient';
import { getClientQuotesListApi } from '@shared/services/conexion';
import { cookies } from 'next/headers';

export default async function ClientQuotesPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  void locale;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  let quotes = [] as Awaited<ReturnType<typeof getClientQuotesListApi>>['quotes'];
  let error: string | null = null;
  try {
    const payload = await getClientQuotesListApi(token);
    quotes = payload.quotes ?? [];
  } catch (e: any) {
    error = e?.message ?? 'No fue posible cargar cotizaciones';
  }
  return (
    <div className="px-6 py-8 lg:px-8">
      <MainQuotesClient quotes={quotes} errorMessage={error} />
    </div>
  );
}
