"use client";

import PageHeader from '@shared/components/common/PageHeader';
import Link from 'next/link';
import type { ClientQuoteRecord } from '@app/modules/client/quotes/types';

type Props = {
  quote: ClientQuoteRecord | null;
  errorMessage: string | null;
  locale: string;
};

export default function QuoteDetailView({ quote, errorMessage, locale }: Props) {
  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Cotizaciones', href: `/${locale}/client/quotes` },
    { label: quote?.reference ?? quote?.id ?? 'Detalle' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Detalle de la cotización"
        description="Visualiza los servicios y valores incluidos en la cotización."
        actions={(
          <Link
            href={`/${locale}/client/quotes`}
            className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Volver
          </Link>
        )}
      />

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>
      )}

      {quote ? (
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Información general</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoRow label="Cliente" value={quote.client?.name ?? 'No disponible'} />
              <InfoRow label="Referencia" value={quote.reference ?? quote.id} />
              <InfoRow label="Valor total" value={formatCurrency(quote.value)} />
              <InfoRow label="Creación" value={formatDate(quote.created)} />
              <InfoRow label="Actualización" value={formatDate(quote.updated)} />
              <InfoRow label="URL" value={quote.url ? 'Disponible' : 'No disponible'} />
            </dl>
            {quote.description && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900">Descripción</h3>
                <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">{quote.description}</p>
              </div>
            )}
            {quote.url && (
              <div className="mt-6">
                <a
                  href={quote.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Ver documento
                </a>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Servicios incluidos</h2>
            {quote.quote_detail.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Ítem</th>
                      <th className="px-3 py-2 text-left font-medium">Servicio</th>
                      <th className="px-3 py-2 text-left font-medium">Cantidad</th>
                      <th className="px-3 py-2 text-left font-medium">Precio</th>
                      <th className="px-3 py-2 text-left font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {quote.quote_detail.map((detail) => (
                      <tr key={detail.id}>
                        <td className="px-3 py-2 text-gray-700">{detail.item}</td>
                        <td className="px-3 py-2 text-gray-700">
                          {detail.service?.name ?? 'Servicio sin nombre'}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{detail.quantity}</td>
                        <td className="px-3 py-2 text-gray-700">{formatCurrency(detail.service?.price ?? null)}</td>
                        <td className="px-3 py-2 text-gray-700">{formatCurrency(detail.total_value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">La cotización no tiene servicios asociados.</p>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-gray-900">Adjuntos</h2>
              <p className="text-xs text-gray-500">
                {quote.quote_attachment.length === 0
                  ? 'Sin adjuntos registrados'
                  : `${quote.quote_attachment.length} adjunto(s)`}
              </p>
            </div>
            {quote.quote_attachment.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {quote.quote_attachment.map((attachment) => (
                  <li key={attachment.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-900">Adjunto #{attachment.id}</span>
                      <span className="text-xs text-gray-500">Factura vinculada: {attachment.invoice_id ?? 'N/A'}</span>
                      {attachment.invoice_id ? (
                        <span className="text-xs text-gray-500">Factura generada: {attachment.invoice_id}</span>
                      ) : (
                        <span className="text-xs text-gray-500">Factura aún no generada</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-gray-500">No existen adjuntos para esta cotización.</p>
            )}
          </section>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No se encontró la cotización solicitada.
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

function formatCurrency(value: number | null | undefined) {
  if (value == null) return '-';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
  } catch (error) {
    console.warn('Unable to format currency value', error);
    return String(value);
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
