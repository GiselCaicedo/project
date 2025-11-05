'use client';

import type {
  AdminInvoiceAttachment,
  AdminInvoiceCatalog,
  AdminInvoiceRecord,
  AdminInvoiceStatus,
  PersistAdminInvoiceInput,
} from '@admin/data/invoices';
import type {
  AdminInvoiceDownloadFormat,
} from '@shared/services/conexion';
import type { ColDef } from 'ag-grid-community';
import AgTable from '@shared/components/datagrid/AgTable';
import InvoiceCommentsView from '@admin/invoices/components/InvoiceCommentsView';
import InvoiceForm from '@admin/invoices/components/InvoiceForm';
import InvoiceObservations from '@admin/invoices/components/InvoiceObservations';
import PageHeader from '@app/shared/components/common/PageHeader';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import {
  deleteAdminInvoiceApi,
  downloadAdminInvoiceArtifactApi,
  reportClientInvoicePaymentApi,
  sendAdminInvoiceEmailApi,
  updateAdminInvoiceApi,
} from '@shared/services/conexion';
import { Download, Loader2, Mail, Pencil, Send, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

const STATUS_LABELS: Record<AdminInvoiceStatus, string> = {
  paid: 'Pagada',
  pending: 'Pendiente',
  overdue: 'Vencida',
  cancelled: 'Anulada',
};

const STATUS_STYLES: Record<AdminInvoiceStatus, string> = {
  paid: 'bg-primary-50 text-primary-700 border-primary-100',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  overdue: 'bg-rose-50 text-rose-700 border-rose-100',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

const formatCurrency = (value: number) =>
  value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return '—';
  }
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (value: string | null) => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const inferFilename = (attachment: AdminInvoiceAttachment, invoiceNumber: string) =>
  attachment?.label ?? `${invoiceNumber}.${attachment.type}`;

export default function InvoiceDetailView({
  invoice,
  catalog,
}: {
  invoice: AdminInvoiceRecord;
  catalog: AdminInvoiceCatalog;
}) {
  const router = useRouter();
  const [invoiceState, setInvoiceState] = useState<AdminInvoiceRecord>(invoice);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<AdminInvoiceDownloadFormat | null>(null);
  const { notify } = useAlerts();

  const attachments = useMemo(() => invoiceState.attachments ?? [], [invoiceState.attachments]);
  const details = useMemo(() => invoiceState.details ?? [], [invoiceState.details]);
  const derivedSubtotal = useMemo(
    () =>
      details.reduce((acc, detail) => {
        const value = typeof detail.total === 'number' ? detail.total : 0;
        return acc + (Number.isFinite(value) ? value : 0);
      }, 0),
    [details],
  );
  const subtotal = invoiceState.subtotal ?? derivedSubtotal ?? invoiceState.amount;
  const tax1 = invoiceState.tax1 ?? invoiceState.taxOne?.amount ?? 0;
  const tax2 = invoiceState.tax2 ?? invoiceState.taxTwo?.amount ?? 0;
  const vatEnabled = typeof invoiceState.vatIncluded === 'boolean'
    ? invoiceState.vatIncluded
    : Boolean(invoiceState.includeIva);
  const vatRate = invoiceState.vatRate ?? (vatEnabled ? 0.19 : 0);
  const vatAmount = vatEnabled ? subtotal * vatRate : 0;
  const totalAmount = subtotal + tax1 + tax2 + vatAmount;
  const vatLabel = vatEnabled ? `IVA (${(vatRate * 100).toFixed(0)}%)` : 'IVA';

  const handleBack = () => {
    router.back();
  };

  const handleDownload = async (attachment: AdminInvoiceAttachment) => {
    setDownloadingFormat(attachment.type);
    try {
      const blob = await downloadAdminInvoiceArtifactApi(invoiceState.id, attachment.type);
      downloadBlob(blob, inferFilename(attachment, invoiceState.number));
      setError(null);
    } catch (downloadError: any) {
      console.error('InvoiceDetailView download error', downloadError);
      const messageText = downloadError instanceof Error ? downloadError.message : 'No fue posible descargar el archivo.';
      setError(messageText);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleSendEmail = async () => {
    const recipient = window.prompt('Ingresa el correo del cliente para enviar la factura:');
    if (!recipient) {
      return;
    }
    try {
      const response = await sendAdminInvoiceEmailApi(invoiceState.id, recipient);
      setMessage(response);
      setError(null);
    } catch (emailError: any) {
      console.error('InvoiceDetailView email error', emailError);
      const messageText = emailError instanceof Error ? emailError.message : 'No fue posible enviar la factura.';
      setError(messageText);
      setMessage(null);
    }
  };

  const handleDelete = async () => {
    const confirmation = window.confirm('¿Eliminar esta factura? Esta acción no puede revertirse.');
    if (!confirmation) {
      return;
    }
    try {
      await deleteAdminInvoiceApi(invoiceState.id);
      router.push('../');
    } catch (deleteError: any) {
      console.error('InvoiceDetailView delete error', deleteError);
      const messageText = deleteError instanceof Error ? deleteError.message : 'No fue posible eliminar la factura.';
      setError(messageText);
    }
  };

  const handleFormSubmit = async (payload: PersistAdminInvoiceInput) => {
    setSubmitting(true);
    try {
      const updated = await updateAdminInvoiceApi(invoiceState.id, payload);
      setInvoiceState(updated);
      setIsEditing(false);
      notify({ type: 'success', title: 'Factura actualizada correctamente.' });
      setError(null);
    } catch (updateError: any) {
      console.error('InvoiceDetailView update error', updateError);
      const messageText = updateError instanceof Error ? updateError.message : 'No fue posible actualizar la factura.';
      setError(messageText);
      setMessage(null);
    } finally {
      setSubmitting(false);
    }
  };

  const closeEdit = () => {
    setIsEditing(false);
    setMessage(null);
  };

  const breadcrumbs = useMemo(
    () => [
      { label: 'Panel de Cliente', href: `/es/admin/dashboard` },
      { label: 'Facturas', href: `/es/admin/invoices` },
      { label: invoiceState.number },
    ],
  );

  const actionButtons = (
    <div className="flex flex-wrap items-center justify-between gap-3">

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center rounded-md border border-primary-200 px-3 py-1.5 text-sm text-primary-700 transition hover:bg-primary-50"
        >
          <Pencil className="mr-2 h-4 w-4" />
          {' '}
          Editar
        </button>
        <button
          type="button"
          onClick={handleSendEmail}
          className="inline-flex items-center rounded-md border border-primary-200 px-3 py-1.5 text-sm text-primary-700 transition hover:bg-primary-50"
        >
          <Mail className="mr-2 h-4 w-4" />
          {' '}
          Enviar correo
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex items-center rounded-md border border-rose-200 px-3 py-1.5 text-sm text-rose-600 transition hover:bg-rose-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {' '}
          Eliminar
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Detalle Factura"
        description="[Pendiente]"
        actions={actionButtons}
      />

      {message && <div className="rounded-md border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">{message}</div>}
      {error && <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {isEditing
        ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <InvoiceForm
                catalog={catalog}
                variant="edit"
                defaultValue={invoiceState}
                submitting={submitting}
                onSubmit={handleFormSubmit}
                onCancel={closeEdit}
              />
            </div>
          )
        : (
            <div className="space-y-6">
              {/* Información general */}
              <section className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Información general</h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const blob = await downloadAdminInvoiceArtifactApi(invoiceState.id, 'pdf');
                          downloadBlob(blob, `${invoiceState.number}.pdf`);
                        } catch (e) {
                          console.error('download pdf error', e);
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
                    >
                      <Download className="h-4 w-4" />
                      Descargar PDF
                    </button>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[invoiceState.status]}`}>
                      {STATUS_LABELS[invoiceState.status]}
                    </span>
                  </div>
                </div>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <InfoRow label="Cliente" value={invoiceState.clientName} />
                  <InfoRow label="N° Factura" value={invoiceState.number} />
                  <InfoRow label="Servicio" value={invoiceState.serviceName ?? 'No disponible'} />
                  <InfoRow label="Valor total" value={formatCurrency(totalAmount)} />
                  <InfoRow label="Fecha emisión" value={formatDate(invoiceState.issuedAt)} />
                  <InfoRow label="Fecha vencimiento" value={formatDate(invoiceState.dueAt)} />
                </dl>
                {invoiceState.description && (
                  <div className="mt-4">
                    <h4 className="text-xs font-medium tracking-wide text-gray-500 uppercase">Descripción</h4>
                    <p className="mt-1 text-sm whitespace-pre-line text-gray-700">{invoiceState.description}</p>
                  </div>
                )}
              </section>

              {/* Servicios incluidos */}
              <section className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-base font-semibold text-gray-900">Servicios incluidos</h2>
                {details.length > 0
                  ? (
                      <>
                        <AdminInvoiceServicesTable services={details} />
                        <div className="mt-6 flex justify-end">
                          <div className="w-full max-w-sm space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Subtotal</span>
                              <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">{vatLabel}</span>
                              <span className="font-medium text-gray-900">{formatCurrency(vatAmount)}</span>
                            </div>
                            {tax1 > 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">IMP2</span>
                                <span className="font-medium text-gray-900">{formatCurrency(tax1)}</span>
                              </div>
                            )}
                            {tax2 > 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">IMP3</span>
                                <span className="font-medium text-gray-900">{formatCurrency(tax2)}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between border-t border-gray-300 pt-2 text-base font-semibold">
                              <span className="text-gray-900">Total</span>
                              <span className="text-primary-600">{formatCurrency(totalAmount)}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )
                  : (
                      <p className="mt-4 text-sm text-gray-500">La factura no tiene servicios asociados.</p>
                    )}
              </section>

              <InvoiceObservations invoiceId={invoiceState.id} />
              <InvoiceCommentsView invoiceId={invoiceState.id} />

              <PaymentsListAdmin payments={invoiceState.payments ?? []} />

              <ReportPaymentForm invoiceId={invoiceState.id} onPaymentAdded={() => window.location.reload()} />

            </div>
          )}
    </div>
  );
}

function PaymentsListAdmin({ payments }: { payments: Array<{ id: string; url?: string | null; created?: string | null }> }) {
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
                <p className="mt-1 text-xs text-gray-500">{formatDateTime(payment.created)}</p>
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

function ReportPaymentForm({ invoiceId, onPaymentAdded }: { invoiceId: string; onPaymentAdded?: () => void }) {
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
      if (onPaymentAdded) {
        onPaymentAdded();
      }
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

type AdminInvoiceDetail = { id: string; serviceName: string; quantity: number; unitPrice?: number | null; total: number };

function AdminInvoiceServicesTable({ services }: { services: AdminInvoiceDetail[] }) {
  const columns: ColDef<AdminInvoiceDetail>[] = useMemo(() => [
    {
      headerName: 'Ítem',
      valueGetter: (params) => params.node ? params.node.rowIndex + 1 : '',
      minWidth: 80,
      maxWidth: 100,
      cellClass: 'text-center justify-center',
    },
    {
      headerName: 'Detalle',
      field: 'serviceName',
      flex: 1.5,
      minWidth: 200,
    },
    {
      headerName: 'Cantidad',
      field: 'quantity',
      minWidth: 100,
      cellClass: 'text-center justify-center',
    },
    {
      headerName: 'Vl. Unitario',
      field: 'unitPrice',
      minWidth: 130,
      valueFormatter: params => params.value != null ? formatCurrency(params.value) : '-',
      cellClass: 'text-right justify-end',
    },
    {
      headerName: 'IVA (19%)',
      minWidth: 120,
      valueGetter: params => {
        const price = params.data?.unitPrice ?? 0;
        const quantity = params.data?.quantity ?? 0;
        return price * quantity * 0.19;
      },
      valueFormatter: params => formatCurrency(params.value as number),
      cellClass: 'text-right justify-end',
    },
    {
      headerName: 'Valor Total',
      field: 'total',
      minWidth: 140,
      valueFormatter: params => formatCurrency(params.value ?? 0),
      cellClass: 'text-right justify-end font-semibold',
    },
  ], []);

  const height = Math.min(400, (services.length + 1) * 46 + 60);

  return (
    <AgTable<AdminInvoiceDetail>
      rows={services}
      columns={columns}
      getRowId={row => row.id}
      height={height}
      pageSize={services.length > 10 ? 10 : services.length}
    />
  );
}

