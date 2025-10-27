"use client";

import PageHeader from '@shared/components/common/PageHeader';
import Link from 'next/link';
import type { ClientInvoiceRecord } from '@app/modules/client/invoices/types';

type Props = {
  invoice: ClientInvoiceRecord | null;
  errorMessage: string | null;
  locale: string;
};

export default function InvoiceDetailView({ invoice, errorMessage, locale }: Props) {
  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Facturas', href: `/${locale}/client/invoices` },
    { label: invoice?.description ?? invoice?.id ?? 'Detalle' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Detalle de la factura"
        description="Consulta los conceptos y pagos asociados a la factura."
        actions={(
          <Link
            href={`/${locale}/client/invoices`}
            className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Volver
          </Link>
        )}
      />

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>
      )}

      {invoice ? (
        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Información general</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoRow label="Cliente" value={invoice.client?.name ?? 'No disponible'} />
              <InfoRow label="Servicio" value={invoice.service?.name ?? 'No asociado'} />
              <InfoRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
              <InfoRow label="Impuesto 1" value={formatCurrency(invoice.tax_one)} />
              <InfoRow label="Impuesto 2" value={formatCurrency(invoice.tax_two)} />
              <InfoRow label="Total" value={formatCurrency(invoice.total)} />
              <InfoRow label="Incluye IVA" value={invoice.include_iva ? 'Sí' : 'No'} />
              <InfoRow label="Creación" value={formatDate(invoice.created)} />
              <InfoRow label="Actualización" value={formatDate(invoice.updated)} />
              <InfoRow label="Vencimiento" value={formatDate(invoice.expiry)} />
              <InfoRow label="Referencia" value={invoice.id} />
            </dl>
            {invoice.description && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900">Descripción</h3>
                <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">{invoice.description}</p>
              </div>
            )}
            {invoice.url && (
              <div className="mt-6">
                <a
                  href={invoice.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Ver archivo adjunto
                </a>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Conceptos</h2>
            {invoice.invoice_detail.length > 0 ? (
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
                    {invoice.invoice_detail.map((detail) => (
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
              <p className="mt-4 text-sm text-gray-500">La factura no tiene conceptos registrados.</p>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-gray-900">Pagos relacionados</h2>
              <p className="text-xs text-gray-500">
                {invoice.payment_attachment.length === 0
                  ? 'Sin pagos asociados'
                  : `${invoice.payment_attachment.length} pago(s)`}
              </p>
            </div>
            {invoice.payment_attachment.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {invoice.payment_attachment.map((attachment) => (
                  <li key={attachment.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-900">Pago: {attachment.payment_id ?? 'Sin referencia'}</span>
                      <span className="text-xs text-gray-500">Factura vinculada: {attachment.invoice_id ?? 'N/A'}</span>
                      {attachment.url && (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          Ver comprobante
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-gray-500">No se registran pagos vinculados a esta factura.</p>
            )}
          </section>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No se encontró la factura solicitada.
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

function formatCurrency(value: number | string | null | undefined) {
  if (value == null) return '-';
  const numericValue = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numericValue)) return String(value);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(numericValue);
  } catch (error) {
    console.warn('Unable to format currency value', error);
    return String(numericValue);
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
