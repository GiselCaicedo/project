import QuoteDetailView from '@app/modules/client/quotes/components/QuoteDetailView';
import { getClientQuoteDetailApi } from '@shared/services/conexion';
import { cookies } from 'next/headers';

export default async function ClientQuoteDetailPage(
  props: { params: Promise<{ locale: string; id: string }> },
) {
  const { locale, id } = await props.params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  let quote = null as Awaited<ReturnType<typeof getClientQuoteDetailApi>>;
  let error: string | null = null;

  if (!id) {
    error = 'Identificador de cotización inválido.';
  } else {
    try {
      quote = await getClientQuoteDetailApi(id, token ?? undefined);
      if (!quote) {
        error = 'No se encontró la cotización solicitada.';
      }
    } catch (e: any) {
      error = e?.message ?? 'No fue posible cargar la información de la cotización.';
    }
  }

  return (
    <div className="px-6 py-8 lg:px-8">
      <QuoteDetailView quote={quote} errorMessage={error} locale={locale} />
    </div>
  );
}
