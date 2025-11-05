'use client';

import type { ClientInvoiceRecord } from '@app/modules/client/invoices/types';
import type { ColDef } from 'ag-grid-community';
import PageHeader from '@shared/components/common/PageHeader';
import AgTable from '@shared/components/datagrid/AgTable';
import {  
  createClientInvoiceCommentApi,
  deleteClientInvoiceCommentApi,
  downloadClientInvoiceArtifactApi,
  getClientInvoiceCommentsApi,
  getClientInvoiceObservationsApi,
  reportClientInvoicePaymentApi,
} from '@shared/services/conexion';
import { Download, Loader2, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  invoice: ClientInvoiceRecord | null;
  errorMessage: string | null;
  locale: string;
};

export default function InvoiceDetailView({ invoice, errorMessage, locale }: Props) {
  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Facturas', href: `/${locale}/client/invoices` },
    { label: 'Detalle', href: `/${locale}/client/invoices/${invoice?.id}` }  ];

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
          {/* InformaciÃƒÆ’Ã‚Â³n general */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">InformaciÃƒÆ’Ã‚Â³n general</h2>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const blob = await downloadClientInvoiceArtifactApi(invoice.id, 'pdf');
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = `${invoice.consecutive ?? invoice.description ?? 'factura'}.pdf`; a.click(); URL.revokeObjectURL(url);
                  } catch (e) {
                    console.error('download pdf error', e); alert('No fue posible descargar el PDF');
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
              >
                <Download className="h-4 w-4" />
                Descargar PDF
              </button>
            </div>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoRow label="Cliente" value={invoice.client?.name ?? 'No disponible'} />
              <InfoRow label="No. Factura" value={invoice.consecutive ?? invoice.description ?? invoice.id} />
              {invoice.description && (
                <InfoRow label="Descripción" value={invoice.description} />
              )}
              <InfoRow label="Servicio" value={invoice.service?.name ?? 'No disponible'} />
              <InfoRow label="Valor total" value={formatCurrency(invoice.total)} />
              <InfoRow label="Fecha emisión" value={formatDate(invoice.created)} />
              <InfoRow label="Fecha vencimiento" value={formatDate(invoice.expiry)} />
            </dl>
          </section>

          {/* Servicios incluidos */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-900">Servicios incluidos</h2>
            {invoice.invoice_detail.length > 0
              ? (
                  <>
                    <InvoiceServicesTable services={invoice.invoice_detail} />
                    <div className="mt-6 flex justify-end">
                      <div className="w-full max-w-sm space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">IVA</span>
                          <span className="font-medium text-gray-900">{formatCurrency(invoice.tax_one)}</span>
                        </div>
                        {invoice.tax_two && invoice.tax_two > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">IMP2</span>
                            <span className="font-medium text-gray-900">{formatCurrency(invoice.tax_two)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between border-t border-gray-300 pt-2 text-base font-semibold">
                          <span className="text-gray-900">Total</span>
                          <span className="text-primary-600">{formatCurrency(invoice.total)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )
              : (
                  <p className="mt-4 text-sm text-gray-500">La factura no tiene servicios asociados.</p>
                )}
          </section>

          {/* Anexos de la factura */}
          <InvoiceAttachments invoiceId={invoice.id} />

          {/* Observaciones (solo ver) */}
          <ClientInvoiceObservations invoiceId={invoice.id} />

          {/* Comentarios (CRUD) */}
          <ClientInvoiceComments invoiceId={invoice.id} />

          {/* Pagos existentes */}
          <PaymentsList payments={invoice.payment_attachment ?? []} />

          {/* Informar Pago */}
          <ReportPaymentForm invoiceId={invoice.id} />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No se encontrÃƒÆ’Ã‚Â³ la factura solicitada.
        </div>
      )}
    </div>
  );
}

function InvoiceAttachments({ invoiceId }: { invoiceId: string }) {
  // Por ahora, este componente es solo visual. Puedes implementar la funcionalidad de subir archivos en el futuro.
  const [attachments, setAttachments] = useState<Array<{ id: string; name: string; url?: string | null; type?: string | null; created?: string | null }>>([]);
  const [loading, setLoading] = useState(false);

  // TODO: Implementar API para obtener anexos cuando estÃƒÆ’Ã‚Â© lista en el backend
  // useEffect(() => {
  //   (async () => {
  //     setLoading(true);
  //     try {
  //       const data = await getClientInvoiceAttachmentsApi(invoiceId);
  //       setAttachments(data || []);
  //     } finally {
  //       setLoading(false);
  //     }
  //   })();
  // }, [invoiceId]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-base font-semibold text-gray-900">Anexos</h2>
      <p className="mt-1 text-sm text-gray-500">
        Documentos y archivos adicionales relacionados con esta factura.
      </p>
      {loading
        ? <div className="py-6 text-sm text-gray-500">Cargando...</div>
        : attachments.length === 0
          ? <p className="mt-4 text-sm text-gray-500">Sin anexos disponibles.</p>
          : (
              <ul className="mt-4 space-y-2">
                {attachments.map(attachment => (
                  <li key={attachment.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{attachment.name}</p>
                        {attachment.type && <p className="mt-0.5 text-xs text-gray-500">{attachment.type}</p>}
                        <p className="mt-1 text-xs text-gray-500">{formatDate(attachment.created)}</p>
                      </div>
                      {attachment.url && (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100"
                        >
                          <Download className="h-4 w-4" />
                          Ver
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
    </section>
  );
}

function ClientInvoiceObservations({ invoiceId }: { invoiceId: string }) {
  const [rows, setRows] = useState<Array<{ id: string; content: string; created: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getClientInvoiceObservationsApi(invoiceId);
        setRows((data || []).map(d => ({ id: d.id, content: d.content, created: d.created })));
      } finally {
        setLoading(false);
      }
    })();
  }, [invoiceId]);
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-base font-semibold text-gray-900">Observaciones</h2>
      {loading
        ? <div className="py-6 text-sm text-gray-500">Cargando...</div>
        : rows.length === 0
          ? <p className="mt-2 text-sm text-gray-500">Sin observaciones.</p>
          : (
              <ul className="mt-3 space-y-2">
                {rows.map(r => (
                  <li key={r.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-sm whitespace-pre-wrap text-gray-800">{r.content}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatDate(r.created)}</p>
                  </li>
                ))}
              </ul>
            )}
    </section>
  );
}

function ClientInvoiceComments({ invoiceId }: { invoiceId: string }) {
  const [rows, setRows] = useState<Array<{ id: string; content: string; created: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getClientInvoiceCommentsApi(invoiceId);
        setRows((data || []).map(d => ({ id: d.id, content: d.content, created: d.created })));
      } finally {
        setLoading(false);
      }
    })();
  }, [invoiceId]);
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!text.trim()) {
      return;
    }
    setSubmitting(true);
    try {
      const created = await createClientInvoiceCommentApi(invoiceId, text.trim());
      setRows(prev => [{ id: created.id, content: created.content, created: created.created }, ...prev]);
      setText('');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-base font-semibold text-gray-900">Comentarios</h2>
      <form onSubmit={handleCreate} className="mt-3 flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Escribe un comentario" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button type="submit" disabled={submitting || !text.trim()} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {' '}
          Publicar
        </button>
      </form>
      {loading
        ? <div className="py-4 text-sm text-gray-500">Cargando...</div>
        : rows.length === 0
          ? <p className="mt-2 text-sm text-gray-500">Sin comentarios.</p>
          : (
              <ul className="mt-4 space-y-2">
                {rows.map(r => (
                  <li key={r.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="flex-1 text-sm whitespace-pre-wrap text-gray-800">{r.content}</p>
                      <button
                        type="button"
                        className="rounded p-1 text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          if (!confirm('Ãƒâ€šÃ‚Â¿Eliminar comentario?')) {
                            return;
                          } await deleteClientInvoiceCommentApi(r.id); setRows(prev => prev.filter(x => x.id !== r.id));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{formatDate(r.created)}</p>
                  </li>
                ))}
              </ul>
            )}
    </section>
  );
}

function PaymentsList({ payments }: { payments: Array<{ id: string; url?: string | null; created?: string | null }> }) {
  if (!payments || payments.length === 0) {
    return null;
  }
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-base font-semibold text-gray-900">Pagos Registrados</h2>
      <ul className="mt-3 space-y-2">
        {payments.map((payment, idx) => (
          <li key={payment.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Pago #
                  {idx + 1}
                </p>
                <p className="mt-1 text-xs text-gray-500">{formatDate(payment.created)}</p>
              </div>
              {payment.url && (
                <a
                  href={payment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <Download className="h-4 w-4" />
                  {' '}
                  Ver comprobante
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReportPaymentForm({ invoiceId }: { invoiceId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result ?? '')); reader.onerror = reject; reader.readAsDataURL(f);
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!file) {
      return;
    }
    setSubmitting(true); setMessage(null); setError(null);
    try {
      const data = await toBase64(file);
      await reportClientInvoicePaymentApi(invoiceId, { name: file.name, data, type: file.type });
      setMessage('Pago informado correctamente.'); setFile(null);
      window.location.reload();
    } catch (e: any) {
      setError(e?.message ?? 'No fue posible informar el pago');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 ">
      <h2 className="text-base font-semibold text-gray-900">Informar Pago</h2>
      {message && <div className="mt-2 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>}
      {error && <div className="mt-2 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} className="flex-1 text-sm" />
        <button type="submit" disabled={submitting || !file} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {' '}
          Enviar comprobante
        </button>
      </form>
    </section>
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

type InvoiceServiceDetail = NonNullable<ClientInvoiceRecord['invoice_detail'][number]>;

function InvoiceServicesTable({ services }: { services: InvoiceServiceDetail[] }) {
  const columns: ColDef<InvoiceServiceDetail>[] = useMemo(() => [
    {
      headerName: 'ÃƒÆ’Ã‚Âtem',
      field: 'item',
      minWidth: 80,
      maxWidth: 100,
      cellClass: 'text-center justify-center',
    },
    {
      headerName: 'Detalle',
      field: 'service',
      flex: 1.5,
      minWidth: 200,
      valueGetter: params => params.data?.service?.name ?? 'Servicio sin nombre',
    },
    {
      headerName: 'Cantidad',
      field: 'quantity',
      minWidth: 100,
      cellClass: 'text-center justify-center',
    },
    {
      headerName: 'Vl. Unitario',
      field: 'service.price',
      minWidth: 130,
      valueFormatter: params => formatCurrency(params.data?.service?.price ?? null),
      cellClass: 'text-right justify-end',
    },
    {
      headerName: 'IVA (19%)',
      minWidth: 120,
      valueGetter: params => {
        const price = params.data?.service?.price ?? 0;
        const quantity = params.data?.quantity ?? 0;
        return price * quantity * 0.19;
      },
      valueFormatter: params => formatCurrency(params.value as number),
      cellClass: 'text-right justify-end',
    },
    {
      headerName: 'Valor Total',
      field: 'total_value',
      minWidth: 140,
      valueFormatter: params => formatCurrency(params.value as number),
      cellClass: 'text-right justify-end font-semibold',
    },
  ], []);

  const height = Math.min(400, (services.length + 1) * 46 + 60);

  return (
    <AgTable<InvoiceServiceDetail>
      rows={services}
      columns={columns}
      getRowId={row => row.id}
      height={height}
      pageSize={services.length > 10 ? 10 : services.length}
    />
  );
}

function formatCurrency(value: number | null | undefined) {
  if (value == null) {
    return '-';
  }
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  } catch (error) {
    console.warn('Unable to format currency value', error);
    return String(value);
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
