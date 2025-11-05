'use client';

import type { CreateQuoteInput, QuoteServiceInput } from '@admin/quotes/types';
import type { ServiceRecord } from '@admin/services/types';
import type { Client } from '@shared/services/conexion';
import { formatCurrency } from '@shared/utils/formatters';
import { useEffect, useMemo, useState } from 'react';

type QuoteCreateFormProps = {
  open: boolean;
  locale: string;
  clients: Client[];
  services: ServiceRecord[];
  loading?: boolean;
  submitting?: boolean;
  errorMessage?: string | null;
  onReload?: () => Promise<void> | void;
  onSubmit: (payload: CreateQuoteInput) => Promise<void>;
  onCancel: () => void;
};

type ServiceRow = {
  id: string;
  serviceId: string;
  quantity: string;
  unitPrice: string;
};

const createRow = (): ServiceRow => ({
  id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  serviceId: '',
  quantity: '1',
  unitPrice: '',
});

const parseNumber = (value: string): number => {
  if (!value) {
    return Number.NaN;
  }
  const normalized = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

export default function QuoteCreateForm({
  open,
  locale,
  clients,
  services,
  loading = false,
  submitting = false,
  errorMessage = null,
  onReload,
  onSubmit,
  onCancel,
}: QuoteCreateFormProps) {
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [rows, setRows] = useState<ServiceRow[]>(() => [createRow()]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      return;
    }

    setClientId('');
    setDescription('');
    setIssuedAt('');
    setRows([createRow()]);
    setError(null);
  }, [open]);

  const serviceMap = useMemo(() => {
    const map = new Map<string, ServiceRecord>();
    for (const service of services) {
      map.set(service.id, service);
    }
    return map;
  }, [services]);

  const handleRowChange = (id: string, key: keyof ServiceRow, value: string) => {
    setRows(current =>
      current.map((row) => {
        if (row.id !== id) {
          return row;
        }

        if (key === 'serviceId') {
          const trimmed = value.trim();
          const service = serviceMap.get(trimmed);
          const defaultPrice = service?.subtotal ?? service?.price ?? null;
          return {
            ...row,
            serviceId: trimmed,
            unitPrice:
              row.unitPrice.trim().length === 0 && typeof defaultPrice === 'number' && Number.isFinite(defaultPrice)
                ? String(defaultPrice)
                : row.unitPrice,
          };
        }

        if (key === 'quantity') {
          const sanitized = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
          return { ...row, quantity: sanitized };
        }

        if (key === 'unitPrice') {
          const sanitized = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
          return { ...row, unitPrice: sanitized };
        }

        return { ...row, [key]: value } as ServiceRow;
      }),
    );
  };

  const handleAddRow = () => {
    setRows(current => [...current, createRow()]);
  };

  const handleRemoveRow = (id: string) => {
    setRows(current => (current.length <= 1 ? current : current.filter(row => row.id !== id)));
  };

  const computedTotals = useMemo(() => {
    return rows.map((row) => {
      const quantity = parseNumber(row.quantity);
      const unitPrice = parseNumber(row.unitPrice);
      if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
        return 0;
      }
      return quantity * unitPrice;
    });
  }, [rows]);

  const totalAmount = useMemo(() => computedTotals.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0), [
    computedTotals,
  ]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || submitting) {
      return;
    }

    setError(null);

    const trimmedClient = clientId.trim();
    if (trimmedClient.length === 0) {
      setError('Selecciona el cliente para la cotización.');
      return;
    }

    if (rows.length === 0) {
      setError('Agrega al menos un servicio a la cotización.');
      return;
    }

    const servicesPayload: QuoteServiceInput[] = [];

    for (const row of rows) {
      const serviceId = row.serviceId.trim();
      if (serviceId.length === 0) {
        setError('Cada fila debe tener un servicio seleccionado.');
        return;
      }

      const quantity = parseNumber(row.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setError('Ingresa una cantidad válida para cada servicio.');
        return;
      }

      const unitPriceValue = parseNumber(row.unitPrice);
      if (!Number.isFinite(unitPriceValue) || unitPriceValue < 0) {
        setError('Ingresa un precio válido para cada servicio.');
        return;
      }

      servicesPayload.push({
        serviceId,
        quantity,
        unitPrice: unitPriceValue,
        total: Number.isFinite(unitPriceValue * quantity) ? unitPriceValue * quantity : undefined,
      });
    }

    const payload: CreateQuoteInput = {
      clientId: trimmedClient,
      services: servicesPayload,
    };

    const trimmedDescription = description.trim();
    if (trimmedDescription.length > 0) {
      payload.description = trimmedDescription;
    }

    if (issuedAt.trim().length > 0) {
      payload.issuedAt = issuedAt;
    }

    try {
      await onSubmit(payload);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'No fue posible crear la cotización.';
      setError(message);
    }
  };

  const canSubmit = !loading && !submitting && clients.length > 0 && services.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-5">
    

      {errorMessage
        ? (
            <div className="space-y-3">
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{errorMessage}</div>
              {onReload
                ? (
                    <button
                      type="button"
                      onClick={() => {
                        void onReload();
                      }}
                      className="rounded-full border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                    >
                      Reintentar carga
                    </button>
                  )
                : null}
            </div>
          )
        : null}

      {error ? <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

      {loading
        ? (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
              Cargando información de clientes y servicios…
            </div>
          )
        : null}

      <label className="flex flex-col gap-1 text-sm text-gray-700">
        <span className="font-medium">Cliente</span>
        <select
          value={clientId}
          onChange={event => setClientId(event.target.value)}
          disabled={loading || clients.length === 0}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none disabled:cursor-not-allowed"
        >
          <option value="">Selecciona un cliente</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-700">
        <span className="font-medium">Descripción</span>
        <textarea
          value={description}
          onChange={event => setDescription(event.target.value)}
          placeholder="Descripción de la cotización"
          rows={3}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-700">
        <span className="font-medium">Fecha de emisión</span>
        <input
          type="date"
          value={issuedAt}
          onChange={event => setIssuedAt(event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
        />
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Servicios incluidos</h3>
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center rounded-full border border-primary-200 px-3 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-50"
            disabled={loading || services.length === 0}
          >
            Agregar servicio
          </button>
        </div>

        <div className="space-y-3">
          {rows.map((row, index) => {
            const total = computedTotals[index];
            const formattedTotal = Number.isFinite(total) ? formatCurrency(total, locale) : '—';
            return (
              <div key={row.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="flex flex-1 flex-col gap-1 text-xs text-gray-700">
                    <span className="font-medium">Servicio</span>
                    <select
                      value={row.serviceId}
                      onChange={event => handleRowChange(row.id, 'serviceId', event.target.value)}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
                      disabled={loading || services.length === 0}
                    >
                      <option value="">Selecciona un servicio</option>
                      {services.map(service => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex w-full max-w-[50px] flex-col gap-1 text-xs text-gray-700">
                    <span className="font-medium">Cantidad</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.quantity}
                      onChange={event => handleRowChange(row.id, 'quantity', event.target.value)}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
                    />
                  </label>

                  <label className="flex w-full max-w-[100px] flex-col gap-1 text-xs text-gray-700">
                    <span className="font-medium">Precio unitario</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.unitPrice}
                      onChange={event => handleRowChange(row.id, 'unitPrice', event.target.value)}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
                    />
                  </label>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                  <span>
                    Total estimado:
                    {' '}
                    <span className="font-semibold text-gray-900">{formattedTotal}</span>
                  </span>
                  {rows.length > 1
                    ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="text-xs font-medium text-rose-600 hover:underline"
                        >
                          Quitar
                        </button>
                      )
                    : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
        <span className="text-gray-600">Monto estimado</span>
        <span className="font-semibold text-gray-900">{formatCurrency(totalAmount, locale)}</span>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-full border border-primary-200 bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Creando…' : 'Crear cotización'}
        </button>
      </div>
    </form>
  );
}
