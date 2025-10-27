"use client";

import PageHeader from '@shared/components/common/PageHeader';
import Link from 'next/link';
import type { ClientPaymentRecord } from '@app/modules/client/payments/types';

type Props = {
  payment: ClientPaymentRecord | null;
  errorMessage: string | null;
  locale: string;
};

export default function PaymentDetailView({ payment, errorMessage, locale }: Props) {
  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Pagos', href: `/${locale}/client/payments` },
    { label: payment?.code ?? payment?.id ?? 'Detalle' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Detalle del pago"
        description="Consulta la información del pago registrado."
        actions={(
          <Link
            href={`/${locale}/client/payments`}
            className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Volver
          </Link>
        )}
      />

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>
      )}

      {payment ? (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <dl className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Cliente" value={payment.client?.name ?? 'No disponible'} />
            <InfoRow label="Código" value={payment.code ?? payment.id} />
            <InfoRow label="Valor" value={formatCurrency(payment.value)} />
            <InfoRow label="Tipo" value={payment.type} />
            <InfoRow label="Estado" value={formatStatus(payment.status_pay)} />
            <InfoRow label="Método" value={payment.payment_method?.name ?? 'No especificado'} />
            <InfoRow label="Creación" value={formatDate(payment.created)} />
            <InfoRow label="Actualización" value={formatDate(payment.updated)} />
          </dl>
          {payment.url && (
            <div className="mt-6">
              <a
                href={payment.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Ver comprobante
              </a>
            </div>
          )}
        </section>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No se encontró el pago solicitado.
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function formatCurrency(value: string | null | undefined) {
  if (!value) return '-';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(numeric);
  } catch (error) {
    console.warn('Unable to format currency value', error);
    return value;
  }
}

function formatStatus(status: string) {
  const normalized = status?.toLowerCase?.() ?? status;
  switch (normalized) {
    case 'pending':
      return 'Pendiente';
    case 'completed':
      return 'Completado';
    case 'failed':
      return 'Fallido';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
