import PageHeader from '@shared/components/common/PageHeader';
import { cookies } from 'next/headers';
import { getClientPaymentMethodsApi } from '@shared/services/conexion';
import Link from 'next/link';

export default async function ClientMethodPayPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  void locale;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  let methods = [] as Awaited<ReturnType<typeof getClientPaymentMethodsApi>>;
  let error: string | null = null;
  try {
    methods = await getClientPaymentMethodsApi(token);
  } catch (e: any) {
    error = e?.message ?? 'No fue posible cargar métodos de pago';
  }
  return (
    <div className="px-6 py-8 lg:px-8">
      <PageHeader title="Métodos de pago" description="Gestiona tus métodos de pago." />
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {methods.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-800">
            <span className="font-medium text-gray-900">{m.name}</span>
            <Link
              href={`/${locale}/client/method_pay/${m.id}`}
              className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Vista
            </Link>
          </li>
        ))}
        {methods.length === 0 && !error && (
          <li className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
            No hay métodos disponibles.
          </li>
        )}
      </ul>
    </div>
  );
}
