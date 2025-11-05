'use client';

import type {
  QuoteActionType,
  QuoteDetail,
  SendQuoteEmailInput,
} from './types';
import type { ColDef } from 'ag-grid-community';
import AgTable from '@shared/components/datagrid/AgTable';
import { formatCurrency } from '@shared/utils/formatters';
import { ArrowUpRight, FileText, Loader2, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import QuoteCommentsView from './QuoteCommentsView';
import QuoteObservations from './QuoteObservations';

const statusTone: Record<QuoteDetail['status'], { label: string; tone: string }> = {
  aprobada: { label: 'Aprobada', tone: 'bg-primary-100 text-primary-700' },
  pendiente: { label: 'Pendiente', tone: 'bg-amber-100 text-amber-700' },
};

const attachmentTone: Record<string, { label: string; tone: string }> = {
  aprobada: { label: 'Aprobada', tone: 'bg-primary-100 text-primary-700' },
  pendiente: { label: 'Pendiente', tone: 'bg-amber-100 text-amber-700' },
};

type QuoteDetailInspectorProps = {
  quote: QuoteDetail | null;
  loading: boolean;
  locale: string;
  onGeneratePdf?: () => Promise<void>;
  onSendEmail?: (payload: SendQuoteEmailInput) => Promise<void>;
  onConvertToInvoice?: () => Promise<void>;
  onEditServices?: () => void;
  actionLoading?: QuoteActionType | null;
  errorMessage?: string | null;
  successMessage?: string | null;
  mode?: 'panel' | 'page';
  className?: string;
};

const extractAction = (quote: QuoteDetail | null, type: QuoteActionType) =>
  quote?.actions.find(action => action.type === type) ?? null;

export default function QuoteDetailInspector({
  quote,
  loading,
  locale,
  onGeneratePdf,
  onSendEmail,
  onConvertToInvoice,
  onEditServices,
  actionLoading = null,
  errorMessage = null,
  successMessage = null,
  mode = 'panel',
  className,
}: QuoteDetailInspectorProps) {
  const [recipientsInput, setRecipientsInput] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setRecipientsInput('');
    setMessageInput('');
    setLocalError(null);
  }, [quote?.id]);

  const pdfAction = useMemo(() => extractAction(quote, 'pdf'), [quote]);
  const emailAction = useMemo(() => extractAction(quote, 'email'), [quote]);
  const invoiceAction = useMemo(() => extractAction(quote, 'invoice'), [quote]);

  const formattedAmount = quote ? formatCurrency(quote.amount ?? 0, locale) : '—';

  const handleGeneratePdf = async () => {
    if (!onGeneratePdf) {
      return;
    }
    setLocalError(null);
    try {
      await onGeneratePdf();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible generar el PDF.';
      setLocalError(message);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!onConvertToInvoice) {
      return;
    }
    setLocalError(null);
    try {
      await onConvertToInvoice();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible convertir la cotización.';
      setLocalError(message);
    }
  };

  const handleSendEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!onSendEmail || !quote) {
      return;
    }
    const recipients = recipientsInput
      .split(/[\n,;]+/)
      .map(value => value.trim())
      .filter(value => value.length > 0);

    if (recipients.length === 0) {
      setLocalError('Agrega al menos un destinatario válido.');
      return;
    }

    setLocalError(null);

    try {
      await onSendEmail({
        recipients,
        message: messageInput.trim().length > 0 ? messageInput.trim() : undefined,
      });
      setRecipientsInput('');
      setMessageInput('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No fue posible enviar la cotización.';
      setLocalError(message);
    }
  };

  const serviceColumns: ColDef[] = useMemo(() => [
    {
      headerName: 'Ítem',
      field: 'item',
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
      valueFormatter: params => formatCurrency(params.value ?? 0, locale),
      cellClass: 'text-right justify-end',
    },
    {
      headerName: 'IVA (19%)',
      minWidth: 120,
      valueGetter: params => {
        const price = (params.data as any)?.unitPrice ?? 0;
        const quantity = (params.data as any)?.quantity ?? 0;
        return price * quantity * 0.19;
      },
      valueFormatter: params => formatCurrency(params.value as number, locale),
      cellClass: 'text-right justify-end',
    },
    {
      headerName: 'Valor Total',
      field: 'total',
      minWidth: 140,
      valueFormatter: params => formatCurrency(params.value ?? 0, locale),
      cellClass: 'text-right justify-end font-semibold',
    },
  ], [locale]);

  const renderServices = () => {
    if (!quote) {
      return null;
    }
    if (quote.services.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
          Sin servicios asociados.
        </div>
      );
    }

    const height = Math.min(400, (quote.services.length + 1) * 46 + 60);

    return (
      <>
        <AgTable
          rows={quote.services}
          columns={serviceColumns}
          getRowId={row => row.id}
          height={height}
          pageSize={quote.services.length > 10 ? 10 : quote.services.length}
        />
        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-sm space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">{formatCurrency(quote.subtotal ?? 0, locale)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">IVA</span>
              <span className="font-medium text-gray-900">{formatCurrency(quote.taxOne ?? 0, locale)}</span>
            </div>
            {quote.taxTwo && quote.taxTwo > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">IMP2</span>
                <span className="font-medium text-gray-900">{formatCurrency(quote.taxTwo, locale)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-gray-300 pt-2 text-base font-semibold">
              <span className="text-gray-900">Total</span>
              <span className="text-primary-600">{formatCurrency(quote.amount ?? 0, locale)}</span>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderAttachments = () => {
    if (!quote) {
      return null;
    }
    if (quote.attachments.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-5 text-sm text-gray-500">
          Sin documentos relacionados.
        </div>
      );
    }

    return (
      <ul className="space-y-3">
        {quote.attachments.map((attachment) => {
          const status = attachmentTone[attachment.invoiceStatus] ?? {
            label: attachment.invoiceStatus,
            tone: 'bg-gray-100 text-gray-600',
          };
          return (
            <li key={attachment.id} className="rounded-2xl border border-gray-200 px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">
                    Factura
                    {' '}
                    {attachment.invoiceNumber ?? attachment.invoiceId}
                  </p>
                  <p className="text-xs text-gray-500">
                    Monto:
                    {' '}
                    {formatCurrency(attachment.invoiceAmount ?? 0, locale)}
                  </p>
                  <div className="flex items-center gap-3">
                    {attachment.invoiceId && (
                      <Link
                        href={`/${locale}/admin/invoices/${attachment.invoiceId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
                      >
                        Ver detalle
                        {' '}
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    )}
                    {attachment.invoiceUrl && (
                      <Link
                        href={attachment.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
                      >
                        Ver PDF
                        {' '}
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}>
                  {status.label}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className={`flex h-full flex-col ${className ?? ''}`}>
      {errorMessage
        ? (
            <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
          )
        : null}
      {localError
        ? (
            <div className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{localError}</div>
          )
        : null}
      {successMessage
        ? (
            <div className="mb-3 rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">{successMessage}</div>
          )
        : null}

      {loading
        ? (
            <div className="flex flex-1 items-center justify-center py-10 text-sm text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary-500" />
              {' '}
              Cargando detalle…
            </div>
          )
        : (
            <div className={`flex-1 space-y-6 ${mode === 'page' ? '' : 'pb-6'}`}>

              {quote
                ? (
                    <div className="space-y-6">
                      {/* Información general de la cotización */}
                      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white px-4 py-4">
                        <h3 className="text-sm font-semibold text-gray-900">Información general</h3>
                        <dl className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">Cliente</dt>
                            <dd className="mt-1 text-sm text-gray-900">{quote.clientName ?? 'No disponible'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">Referencia</dt>
                            <dd className="mt-1 text-sm text-gray-900">{quote.reference ?? 'N/A'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">Valor total</dt>
                            <dd className="mt-1 text-sm font-semibold text-gray-900">{formattedAmount}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">Estado</dt>
                            <dd className="mt-1">
                              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusTone[quote.status]?.tone ?? 'bg-gray-100 text-gray-600'}`}>
                                {statusTone[quote.status]?.label ?? quote.status}
                              </span>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">Creación</dt>
                            <dd className="mt-1 text-sm text-gray-900">{formatDate(quote.createdAt)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">Actualización</dt>
                            <dd className="mt-1 text-sm text-gray-900">{formatDate(quote.updatedAt)}</dd>
                          </div>
                          {quote.attachments && quote.attachments.length > 0 && quote.attachments[0].invoiceId && (
                            <div>
                              <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase">Factura</dt>
                              <dd className="mt-1">
                                <Link
                                  href={`/${locale}/admin/invoices/${quote.attachments[0].invoiceId}`}
                                  className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-500 hover:underline"
                                >
                                  {quote.attachments[0].invoiceNumber ?? quote.attachments[0].invoiceId ?? 'Ver factura'}
                                  {' '}
                                  <ArrowUpRight className="h-3 w-3" />
                                </Link>
                              </dd>
                            </div>
                          )}
                        </dl>
                        {quote.description && (
                          <div className="mt-4">
                            <h4 className="text-xs font-medium tracking-wide text-gray-500 uppercase">Descripción</h4>
                            <p className="mt-1 text-sm whitespace-pre-line text-gray-700">{quote.description}</p>
                          </div>
                        )}
                      </div>

                      {pdfAction && mode !== 'page'
                        ? (
                            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white px-4 py-4">
                              <h3 className="text-sm font-semibold text-gray-900">Acciones rápidas</h3>
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={handleGeneratePdf}
                                    disabled={!pdfAction.available || actionLoading === 'pdf'}
                                    className="inline-flex items-center gap-2 rounded-full border border-primary-200 px-4 py-2 text-xs font-semibold text-primary-700 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {actionLoading === 'pdf'
                                      ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        )
                                      : (
                                          <RotateCcw className="h-4 w-4" />
                                        )}
                                    Generar PDF
                                  </button>
                                  {pdfAction.url
                                    ? (
                                        <Link
                                          href={pdfAction.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                                        >
                                          <FileText className="h-4 w-4" />
                                          {' '}
                                          {pdfAction.label}
                                        </Link>
                                      )
                                    : null}
                                </div>
                                {pdfAction.disabledReason
                                  ? (
                                      <p className="text-xs text-gray-500">{pdfAction.disabledReason}</p>
                                    )
                                  : null}
                              </div>
                            </div>
                          )
                        : null}

                      {invoiceAction && mode !== 'page'
                        ? (
                            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white px-4 py-4">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary-500" />
                                <h3 className="text-sm font-semibold text-gray-900">Factura</h3>
                              </div>
                              <button
                                type="button"
                                onClick={handleConvertToInvoice}
                                disabled={!invoiceAction.available || actionLoading === 'invoice'}
                                className="inline-flex items-center gap-2 rounded-full border border-primary-200 px-4 py-2 text-xs font-semibold text-primary-700 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {actionLoading === 'invoice'
                                  ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    )
                                  : (
                                      <FileText className="h-4 w-4" />
                                    )}
                                {invoiceAction.label}
                              </button>
                              {invoiceAction.disabledReason
                                ? (
                                    <p className="text-xs text-gray-500">{invoiceAction.disabledReason}</p>
                                  )
                                : null}
                            </div>
                          )
                        : null}

                      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white px-4 py-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900">Servicios incluidos</h3>
                          {onEditServices ? (
                            <button
                              type="button"
                              onClick={onEditServices}
                              className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                            >
                              Editar servicios
                            </button>
                          ) : null}
                        </div>
                        {renderServices()}
                      </div>

                      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white px-4 py-4">
                        <h3 className="text-sm font-semibold text-gray-900">Documentos relacionados</h3>
                        {renderAttachments()}
                      </div>

                      {/* Observaciones del administrador (CRUD) */}
                      <QuoteObservations
                        quoteId={quote.id}
                        initialObservations={quote.observations || []}
                      />

                      {/* Comentarios del cliente (solo lectura) */}
                      {quote.comments && quote.comments.length > 0 && (
                        <QuoteCommentsView comments={quote.comments} />
                      )}
                    </div>
                  )
                : null}
            </div>
          )}
    </div>
  );
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
