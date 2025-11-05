'use client';

import type {
  AdminInvoiceCatalog,
  AdminInvoiceRecord,
  PersistAdminInvoiceInput,
} from '@admin/data/invoices';
import { Plus, Trash2, X } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

type InvoiceFormProps = {
  catalog: AdminInvoiceCatalog;
  variant: 'create' | 'edit';
  defaultValue?: AdminInvoiceRecord | null;
  submitting?: boolean;
  onSubmit: (payload: PersistAdminInvoiceInput) => Promise<void>;
  onCancel: () => void;
};

type InvoiceDetailRowState = {
  key: string;
  serviceId: string;
  quantity: string;
  unitPrice: string;
  item: number | null;
};

const STATUS_OPTIONS: PersistAdminInvoiceInput['status'][] = ['pending', 'paid', 'cancelled'];
const VAT_RATE = 0.19;

const toInputDate = (value: string | null): string => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
};

const toAmountString = (value: number | null | undefined): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '';
  }
  return value.toFixed(2);
};

const parseNumber = (value: string): number => {
  const normalized = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const createEmptyRow = (index: number): InvoiceDetailRowState => ({
  key: `row-${Date.now()}-${index}`,
  serviceId: '',
  quantity: '1',
  unitPrice: '0',
  item: index + 1,
});

const mapRecordToRows = (record: AdminInvoiceRecord | null | undefined): InvoiceDetailRowState[] => {
  if (!record || !Array.isArray(record.details) || record.details.length === 0) {
    return [createEmptyRow(0)];
  }
  return record.details.map((detail, index) => {
    const quantity = detail.quantity || 1;
    const total = detail.total || 0;
    const unitPrice = quantity > 0 ? (total / quantity).toFixed(2) : '0';

    return {
      key: detail.id ?? `row-${index}`,
      serviceId: detail.serviceId ?? '',
      quantity: quantity.toString(),
      unitPrice: unitPrice,
      item: detail.item ?? index + 1,
    };
  });
};

export default function InvoiceForm({
  catalog,
  variant,
  defaultValue = null,
  submitting = false,
  onSubmit,
  onCancel,
}: InvoiceFormProps) {
  const [clientId, setClientId] = useState(defaultValue?.clientId ?? '');
  const [number, setNumber] = useState(defaultValue?.number ?? '');
  const [description, setDescription] = useState<string>(defaultValue?.description ?? '');
  const [status, setStatus] = useState<PersistAdminInvoiceInput['status']>(
    defaultValue?.status === 'paid' || defaultValue?.status === 'cancelled' ? defaultValue.status : 'pending',
  );
  const [issuedAt, setIssuedAt] = useState(toInputDate(defaultValue?.issuedAt ?? null));
  const [dueAt, setDueAt] = useState(toInputDate(defaultValue?.dueAt ?? null));
  const [url, setUrl] = useState(defaultValue?.url ?? '');
  const [rows, setRows] = useState<InvoiceDetailRowState[]>(() => mapRecordToRows(defaultValue));
  const initialTax1Value
    = typeof defaultValue?.tax1 === 'number'
      ? defaultValue.tax1
      : typeof defaultValue?.taxOne?.amount === 'number'
        ? defaultValue.taxOne.amount
        : null;
  const initialTax2Value
    = typeof defaultValue?.tax2 === 'number'
      ? defaultValue.tax2
      : typeof defaultValue?.taxTwo?.amount === 'number'
        ? defaultValue.taxTwo.amount
        : null;
  const initialVatIncluded = Boolean(defaultValue?.vatIncluded ?? defaultValue?.includeIva ?? false);
  const initialVatRate
    = typeof defaultValue?.vatRate === 'number' && Number.isFinite(defaultValue.vatRate)
      ? defaultValue.vatRate
      : VAT_RATE;
  const [tax1, setTax1] = useState(toAmountString(initialTax1Value));
  const [tax2, setTax2] = useState(toAmountString(initialTax2Value));
  const [vatEnabled, setVatEnabled] = useState(initialVatIncluded);
  const [error, setError] = useState<string | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const clients = useMemo(() => catalog.clients ?? [], [catalog.clients]);
  const services = useMemo(() => catalog.services ?? [], [catalog.services]);
  const serviceMap = useMemo(() => new Map(services.map(s => [s.id, s])), [services]);

  const computedSubtotal = useMemo(
    () =>
      rows.reduce((accumulator, row) => {
        const quantity = parseNumber(row.quantity);
        const unitPrice = parseNumber(row.unitPrice);
        const rowTotal = quantity * unitPrice;
        return accumulator + (Number.isFinite(rowTotal) ? rowTotal : 0);
      }, 0),
    [rows],
  );

  const updateRow = (key: string, updater: (row: InvoiceDetailRowState) => InvoiceDetailRowState) => {
    setRows(current => current.map(row => {
      if (row.key !== key) return row;
      const updated = updater(row);

      // Si cambió el serviceId, autocompletar precio desde la tabla service
      if (updated.serviceId !== row.serviceId && updated.serviceId) {
        const service = serviceMap.get(updated.serviceId);
        // Priorizar subtotal sobre price (igual que el backend)
        const defaultPrice = service?.subtotal ?? service?.price ?? null;
        // Actualizar el precio siempre que haya un precio disponible en el servicio
        if (typeof defaultPrice === 'number' && Number.isFinite(defaultPrice)) {
          updated.unitPrice = String(defaultPrice);
        } else {
          // Si no hay precio en el servicio, establecer en 0
          updated.unitPrice = '0';
        }
      }

      return updated;
    }));
  };

  const removeRow = (key: string) => {
    setRows((current) => {
      if (current.length <= 1) {
        return current;
      }
      return current.filter(row => row.key !== key);
    });
  };

  const addRow = () => {
    setRows(current => [...current, createEmptyRow(current.length)]);
  };

  const computedTax1 = parseNumber(tax1);
  const computedTax2 = parseNumber(tax2);
  const computedVat = vatEnabled ? computedSubtotal * initialVatRate : 0;
  const computedTotal = computedSubtotal + computedTax1 + computedTax2 + computedVat;

  const formatCurrency = (value: number) =>
    Number.isFinite(value)
      ? value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })
      : '$0';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!clientId) {
      setError('Selecciona un cliente.');
      return;
    }

    if (!number) {
      setError('Indica el número o referencia de la factura.');
      return;
    }

    if (computedSubtotal <= 0) {
      setError('El subtotal debe ser mayor a cero.');
      return;
    }

    const normalizedRows = rows
      .map((row, index) => {
        const quantity = parseNumber(row.quantity);
        const unitPrice = parseNumber(row.unitPrice);
        const total = quantity * unitPrice;

        return {
          serviceId: row.serviceId,
          quantity: quantity,
          total: total,
          item: row.item ?? index + 1,
        };
      })
      .filter(row => row.serviceId);

    if (normalizedRows.length === 0) {
      setError('Debes agregar al menos un servicio a la factura.');
      return;
    }

    const primaryServiceId = normalizedRows[0]?.serviceId ?? '';
    if (!primaryServiceId) {
      setError('Selecciona el servicio principal de la factura.');
      return;
    }

    const payload: PersistAdminInvoiceInput = {
      clientId,
      serviceId: primaryServiceId,
      number,
      description: description?.trim() || null,
      amount: computedTotal,
      status,
      subtotal: computedSubtotal,
      tax1: computedTax1,
      tax2: computedTax2,
      vatIncluded: vatEnabled,
      vatRate: vatEnabled ? initialVatRate : 0,
      issuedAt: issuedAt || null,
      dueAt: dueAt || null,
      url: url.trim() ? url.trim() : null,
      details: normalizedRows,
      documentFile,
    };

    try {
      await onSubmit(payload);
      setError(null);
    } catch (submitError: any) {
      console.error('InvoiceForm submit error:', submitError);
      const message = submitError instanceof Error ? submitError.message : 'No fue posible guardar la factura.';
      setError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">


      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col text-sm text-gray-700">
          <span className="mb-1 font-medium">Cliente</span>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
            value={clientId}
            onChange={event => setClientId(event.target.value)}
          >
            <option value="">Selecciona un cliente…</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm text-gray-700">
          <span className="mb-1 font-medium">Descripción</span>
          <input
            type="text"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
            value={description}
            onChange={event => setDescription(event.target.value)}
            placeholder="Descripción o referencia"
          />
        </label>

        <label className="flex flex-col text-sm text-gray-700">
          <span className="mb-1 font-medium">Número de factura</span>
          <input
            type="text"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
            value={number}
            onChange={event => setNumber(event.target.value)}
            placeholder="Ej. FAC-001"
          />
        </label>

        <label className="flex flex-col text-sm text-gray-700">
          <span className="mb-1 font-medium">Fecha de emisión</span>
          <input
            type="date"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
            value={issuedAt}
            onChange={event => setIssuedAt(event.target.value)}
          />
        </label>

        <label className="flex flex-col text-sm text-gray-700">
          <span className="mb-1 font-medium">Fecha de vencimiento</span>
          <input
            type="date"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
            value={dueAt}
            onChange={event => setDueAt(event.target.value)}
          />
        </label>

        <label className="flex flex-col text-sm text-gray-700">
          <span className="mb-1 font-medium">Estado</span>
          <select
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
            value={status}
            onChange={event => setStatus(event.target.value as PersistAdminInvoiceInput['status'])}
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option === 'pending' ? 'Pendiente' : option === 'paid' ? 'Pagada' : 'Anulada'}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-sm text-gray-700 md:col-span-2">
          <span className="mb-1 font-medium">Enlace del documento</span>
          <input
            type="url"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
            value={url}
            onChange={event => setUrl(event.target.value)}
            placeholder="https://..."
          />
        </label>

        <label className="flex flex-col text-sm text-gray-700 md:col-span-2">
          <span className="mb-1 font-medium">Adjuntar archivo</span>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={event => setDocumentFile(event.target.files?.[0] ?? null)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
          />
          {documentFile
            ? (
                <span className="mt-1 text-xs text-gray-500">{documentFile.name}</span>
              )
            : (
                <span className="mt-1 text-xs text-gray-500">Opcional. Puedes proporcionar un enlace o subir un archivo.</span>
              )}
        </label>
      </div>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Servicios incluidos</h3>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center rounded-md border border-primary-200 px-3 py-1.5 text-sm text-primary-700 transition hover:bg-primary-50"
          >
            <Plus className="mr-1 h-4 w-4" />
            {' '}
            Agregar servicio
          </button>
        </div>

        <div className="space-y-2">
          {rows.map((row, index) => {
            const quantity = parseNumber(row.quantity);
            const unitPrice = parseNumber(row.unitPrice);
            const rowTotal = quantity * unitPrice;

            return (
              <div key={row.key} className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 p-3 md:grid-cols-6 md:items-end">
                <label className="flex flex-col text-xs text-gray-700 md:col-span-2">
                  <span className="mb-1 font-medium">Servicio</span>
                  <select
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
                    value={row.serviceId}
                    onChange={event =>
                      updateRow(row.key, current => ({
                        ...current,
                        serviceId: event.target.value,
                      }))}
                  >
                    <option value="">Selecciona…</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col text-xs text-gray-700">
                  <span className="mb-1 font-medium">Cantidad</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
                    value={row.quantity}
                    onChange={event =>
                      updateRow(row.key, current => ({
                        ...current,
                        quantity: event.target.value,
                      }))}
                  />
                </label>

                <label className="flex flex-col text-xs text-gray-700">
                  <span className="mb-1 font-medium">Precio unitario</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
                    value={row.unitPrice}
                    onChange={event =>
                      updateRow(row.key, current => ({
                        ...current,
                        unitPrice: event.target.value,
                      }))}
                  />
                </label>

                <div className="flex flex-col text-xs text-gray-700">
                  <span className="mb-1 font-medium">Total</span>
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">
                    {formatCurrency(rowTotal)}
                  </div>
                </div>

                <div className="flex items-end justify-between md:col-span-1">
                  <span className="text-xs text-gray-500">
                    #
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    className="inline-flex items-center rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 transition hover:bg-red-50"
                    disabled={rows.length <= 1}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    {' '}
                    Quitar
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumen de totales */}
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3 md:w-1/2">
            <h4 className="text-sm font-semibold text-gray-900">Ajustes de impuestos</h4>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={vatEnabled}
                onChange={event => setVatEnabled(event.target.checked)}
              />
              Aplicar IVA (19%)
            </label>
            <label className="flex flex-col text-xs text-gray-700">
              <span className="mb-1 font-medium">Impuesto 1</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
                value={tax1}
                onChange={event => setTax1(event.target.value)}
                placeholder="0.00"
              />
            </label>
            <label className="flex flex-col text-xs text-gray-700">
              <span className="mb-1 font-medium">Impuesto 2</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
                value={tax2}
                onChange={event => setTax2(event.target.value)}
                placeholder="0.00"
              />
            </label>
            <p className="text-xs text-gray-500">
              El subtotal se calcula automáticamente sumando los totales de los servicios.
            </p>
          </div>

          <div className="w-full max-w-sm space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">{formatCurrency(computedSubtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">IVA {vatEnabled ? '(19%)' : ''}</span>
              <span className="font-medium text-gray-900">{formatCurrency(computedVat)}</span>
            </div>
            {computedTax1 > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">IMP 1</span>
                <span className="font-medium text-gray-900">{formatCurrency(computedTax1)}</span>
              </div>
            )}
            {computedTax2 > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">IMP 2</span>
                <span className="font-medium text-gray-900">{formatCurrency(computedTax2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-gray-300 pt-2 text-base font-semibold">
              <span className="text-gray-900">Total</span>
              <span className="text-primary-600">{formatCurrency(computedTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Guardando…' : variant === 'create' ? 'Crear factura' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
