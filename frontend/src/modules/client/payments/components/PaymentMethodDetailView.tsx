'use client';

import type { PaymentMethodSummary } from '@app/modules/client/payments/types';
import PageHeader from '@shared/components/common/PageHeader';
import Link from 'next/link';

type Props = {
  method: PaymentMethodSummary | null;
  errorMessage: string | null;
  locale: string;
};

export default function PaymentMethodDetailView({ method, errorMessage, locale }: Props) {
  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Métodos de pago', href: `/${locale}/client/method_pay` },
    { label: method?.name ?? 'Detalle' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Detalle del método de pago"
        description="Consulta la información del método de pago disponible."
        actions={(
          <Link
            href={`/${locale}/client/method_pay`}
            className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Volver
          </Link>
        )}
      />

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>
      )}

      {method
        ? (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <dl className="grid gap-4 sm:grid-cols-2">
                <InfoRow label="Nombre" value={method.name} />
                <InfoRow label="Identificador" value={method.id} />
              </dl>
            </section>
          )
        : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
              No se encontró el método de pago solicitado.
            </div>
          )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}
