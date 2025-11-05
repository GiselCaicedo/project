'use client';

import type { FormEvent } from 'react';
import type {
  PaymentMethodSummary,
  PaymentFormAttachment,
  PaymentFormValues,
  InvoiceForPayment,
} from '../types';
import { useEffect, useMemo, useState } from 'react';

const CUSTOM_METHOD = '__custom__';

type PaymentFormDrawerProps = {
  open: boolean;
  title: string;
  submitLabel: string;
  methods: PaymentMethodSummary[];
  invoices: InvoiceForPayment[];
  onSubmit: (values: PaymentFormValues) => Promise<void>;
  onClose: () => void;
  defaultInvoiceId?: string | null;
};

const toDateInput = (value?: string | null): string => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function PaymentFormDrawer({
  open,
  title,
  submitLabel,
  methods,
  invoices,
  onSubmit,
  onClose,
  defaultInvoiceId = null,
}: PaymentFormDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<string | null>('pagado');
  const [methodId, setMethodId] = useState<string | null>(null);
  const [methodName, setMethodName] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [type, setType] = useState('');
  const [paidAt, setPaidAt] = useState('');
  const [confirmed, setConfirmed] = useState<boolean | null>(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(defaultInvoiceId);
  const [attachments, setAttachments] = useState<PaymentFormAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const sortedMethods = useMemo(
    () => methods.map(method => ({ ...method })),
    [methods],
  );

  const sortedInvoices = useMemo(
    () => invoices.map(invoice => ({ ...invoice })),
    [invoices],
  );

  // Solo facturas aprobadas (pendiente o pagada)
  const approvedInvoices = useMemo(
    () => sortedInvoices.filter(inv => inv.status_pay === 'Pendiente' || inv.status_pay === 'Pagada'),
    [sortedInvoices],
  );

  useEffect(() => {
    if (defaultInvoiceId) {
      setSelectedInvoiceId(defaultInvoiceId);
      // Si hay una factura preseleccionada, intentar autocompletar el valor
      const invoice = invoices.find(inv => inv.id === defaultInvoiceId);
      if (invoice && invoice.value) {
        setValue(invoice.value);
      }
    }
  }, [defaultInvoiceId, invoices]);

  useEffect(() => {
    if (!open && mounted) {
      if (!defaultInvoiceId) {
        setValue('');
        setSelectedInvoiceId(null);
      }
      setStatus('pagado');
      setMethodId(null);
      setMethodName('');
      setReceiptUrl('');
      setType('');
      setPaidAt('');
      setConfirmed(true);
      setAttachments([]);
      setFormError(null);
      setIsSubmitting(false);
    }
  }, [open, mounted, defaultInvoiceId]);

  if (!mounted || !open) {
    return null;
  }

  const handleClose = () => {
    setFormError(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleMethodSelect = (selected: string) => {
    if (selected === CUSTOM_METHOD) {
      setMethodId(null);
      setMethodName('');
      return;
    }
    const normalized = selected.trim();
    if (!normalized) {
      setMethodId(null);
      setMethodName('');
      return;
    }
    setMethodId(normalized);
    // No actualizamos methodName aquí, el backend lo resolverá con el methodId
  };

  const handleAttachmentChange = (index: number, field: 'url' | 'invoiceId' | 'isFile', value: string | boolean) => {
    setAttachments((prev) => {
      const next = [...prev];
      const current = next[index];
      if (!current) {
        return prev;
      }
      if (field === 'isFile') {
        next[index] = {
          ...current,
          isFile: value as boolean,
          url: '',
          file: null,
        };
      } else {
        next[index] = {
          ...current,
          [field]: field === 'url' ? value : value || null,
        };
      }
      return next;
    });
  };

  const handleFileChange = (index: number, file: File | null) => {
    setAttachments((prev) => {
      const next = [...prev];
      const current = next[index];
      if (!current) {
        return prev;
      }
      next[index] = {
        ...current,
        file,
        url: file ? file.name : '',
      };
      return next;
    });
  };

  const handleAddAttachment = () => {
    setAttachments(prev => [...prev, { url: '', invoiceId: null, file: null, isFile: false }]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Process attachments - convert files to base64
    const processedAttachments = await Promise.all(
      attachments.map(async (attachment) => {
        if (attachment.isFile && attachment.file) {
          const base64 = await fileToBase64(attachment.file);
          return {
            id: attachment.id,
            url: base64,
            invoiceId: attachment.invoiceId ? attachment.invoiceId.trim() : null,
            isFile: true,
            fileName: attachment.file.name,
            fileType: attachment.file.type,
          };
        }
        return {
          id: attachment.id,
          url: attachment.url.trim(),
          invoiceId: attachment.invoiceId ? attachment.invoiceId.trim() : null,
          isFile: false,
        };
      }),
    );

    const sanitizedAttachments = processedAttachments.filter(attachment => attachment.url.length > 0);

    // Si hay factura seleccionada y hay un comprobante principal, crear un anexo automático vinculado
    if (selectedInvoiceId && receiptUrl.trim()) {
      sanitizedAttachments.push({
        url: receiptUrl.trim(),
        invoiceId: selectedInvoiceId,
        isFile: false,
      } as any);
    }

    const payload: PaymentFormValues = {
      value: value.trim(),
      status: status?.trim() ?? null,
      methodId: methodId ?? undefined,
      methodName: !methodId && methodName.trim() ? methodName.trim() : undefined,
      receiptUrl: receiptUrl.trim() || undefined,
      type: type.trim() || undefined,
      paidAt: paidAt || undefined,
      confirmed,
      attachments: sanitizedAttachments as any,
    };

    try {
      setIsSubmitting(true);
      setFormError(null);
      await onSubmit(payload);
      setValue('');
      setStatus('pagado');
      setMethodId(null);
      setMethodName('');
      setReceiptUrl('');
      setType('');
      setPaidAt('');
      setConfirmed(true);
      setAttachments([]);
      onClose();
    } catch (error: any) {
      setFormError(error?.message ?? 'No fue posible guardar el pago.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = value.trim().length > 0 && (methodId || methodName.trim().length > 0) && !!selectedInvoiceId;

  const statusOptions = [
    { value: 'pagado', label: 'Pagado' },
    { value: 'pendiente', label: 'Pendiente' },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex min-h-full flex-col">
      <div className="space-y-5 px-5 py-5">
        <p className="mt-1 text-sm text-gray-600">
          Completa la información para registrar tu pago en el sistema.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="payment-invoice">
              Factura a pagar <span className="text-red-500">*</span>
            </label>
            <select
              id="payment-invoice"
              name="payment-invoice"
              value={selectedInvoiceId ?? ''}
              required
              onChange={event => {
                const invoiceId = event.target.value || null;
                setSelectedInvoiceId(invoiceId);
                // Autocompletar el valor si se selecciona una factura
                if (invoiceId) {
                  const invoice = approvedInvoices.find(inv => inv.id === invoiceId);
                  if (invoice && invoice.value) {
                    setValue(invoice.value);
                  }
                }
              }}
              disabled={!!defaultInvoiceId}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Sin factura específica</option>
              {approvedInvoices.map(invoice => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.code || 'Sin código'} - {invoice.value || 'Sin valor'} - {invoice.status_pay || 'Sin estado'}
                </option>
              ))}
            </select>
            {defaultInvoiceId && (
              <p className="mt-1 text-xs text-gray-500">
                Esta factura fue preseleccionada desde la página de facturas
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="payment-value">
              Valor del pago <span className="text-red-500">*</span>
            </label>
            <input
              id="payment-value"
              name="payment-value"
              value={value}
              onChange={event => setValue(event.target.value)}
              placeholder="Ej. 1.250.000"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="payment-status">
              Estado
            </label>
            <select
              id="payment-status"
              name="payment-status"
              value={status ?? ''}
              onChange={event => setStatus(event.target.value || null)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            >
              <option value="">Sin especificar</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="payment-date">
              Fecha de pago
            </label>
            <input
              id="payment-date"
              name="payment-date"
              type="date"
              value={paidAt}
              onChange={event => setPaidAt(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="payment-method">
              Método de pago <span className="text-red-500">*</span>
            </label>
            <select
              id="payment-method"
              name="payment-method"
              value={methodId ?? ''}
              onChange={event => handleMethodSelect(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            >
              <option value="">Selecciona un método…</option>
              {sortedMethods.map(method => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
              <option value={CUSTOM_METHOD}>Agregar nuevo método…</option>
            </select>
          </div>

          {!methodId && (
            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="payment-method-name">
                Nombre del método
              </label>
              <input
                id="payment-method-name"
                name="payment-method-name"
                value={methodName}
                onChange={event => setMethodName(event.target.value)}
                placeholder="Ej. Transferencia Bancolombia"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="payment-type">
              Tipo (opcional)
            </label>
            <input
              id="payment-type"
              name="payment-type"
              value={type}
              onChange={event => setType(event.target.value)}
              placeholder="Ej. Transferencia"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="payment-url">
              Enlace del comprobante principal
            </label>
            <input
              id="payment-url"
              name="payment-url"
              value={receiptUrl}
              onChange={event => setReceiptUrl(event.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>
        </div>



        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Anexos del pago</h3>
            <button
              type="button"
              onClick={handleAddAttachment}
              className="text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
            >
              Agregar anexo
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {attachments.length === 0
              ? (
                <p className="text-xs text-gray-500">No se han agregado anexos.</p>
              )
              : (
                attachments.map((attachment, index) => (
                  <div key={attachment.id ?? `attachment-${index}`} className="rounded-xl border border-gray-200 p-3">
                    <div className="mb-3 flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                        <input
                          type="radio"
                          name={`attachment-type-${index}`}
                          checked={!attachment.isFile}
                          onChange={() => handleAttachmentChange(index, 'isFile', false)}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        Enlace (URL)
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                        <input
                          type="radio"
                          name={`attachment-type-${index}`}
                          checked={attachment.isFile === true}
                          onChange={() => handleAttachmentChange(index, 'isFile', true)}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        Archivo
                      </label>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {attachment.isFile
                        ? (
                          <div className="sm:col-span-2">
                            <label className="text-xs font-medium text-gray-600" htmlFor={`attachment-file-${index}`}>
                              Archivo del anexo
                            </label>
                            <input
                              id={`attachment-file-${index}`}
                              name={`attachment-file-${index}`}
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg,.gif"
                              onChange={event => handleFileChange(index, event.target.files?.[0] ?? null)}
                              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                            />
                            {attachment.file && (
                              <p className="mt-1 text-xs text-gray-500">
                                Archivo seleccionado: {attachment.file.name}
                              </p>
                            )}
                          </div>
                        )
                        : (
                          <div className="sm:col-span-2">
                            <label className="text-xs font-medium text-gray-600" htmlFor={`attachment-url-${index}`}>
                              URL del anexo
                            </label>
                            <input
                              id={`attachment-url-${index}`}
                              name={`attachment-url-${index}`}
                              value={attachment.url}
                              onChange={event => handleAttachmentChange(index, 'url', event.target.value)}
                              placeholder="https://..."
                              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                            />
                          </div>
                        )}

                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(index)}
                        className="text-xs font-semibold text-red-600 transition hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3 border-t border-gray-100 px-5 py-4">
        {formError ? <p className="text-xs text-red-600">{formError}</p> : null}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {isSubmitting ? 'Guardando…' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
