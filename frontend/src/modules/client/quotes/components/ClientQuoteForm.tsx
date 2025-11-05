'use client';

import type { ServiceRecord } from '@admin/services/types';
import type { CreateClientQuoteInput } from '@client/quotes/types';
import { formatCurrency } from '@shared/utils/formatters';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type ClientQuoteFormProps = {
  services: ServiceRecord[];
  loading?: boolean;
  submitting?: boolean;
  errorMessage?: string | null;
  defaultValue?: CreateClientQuoteInput | null;
  locale: string;
  onSubmit: (payload: CreateClientQuoteInput) => Promise<void>;
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

export default function ClientQuoteForm({
  services,
  loading = false,
  submitting = false,
  errorMessage = null,
  defaultValue = null,
  locale,
  onSubmit,
  onCancel,
}: ClientQuoteFormProps) {
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState<ServiceRow[]>(() => [createRow()]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultValue) {
      setDescription(defaultValue.description ?? '');
      if (defaultValue.services.length > 0) {
        setRows(
          defaultValue.services.map(service => ({
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2),
            serviceId: service.serviceId,
            quantity: String(service.quantity),
            unitPrice: service.unitPrice != null ? String(service.unitPrice) : '',
          })),
        );
      }
    }
  }, [defaultValue]);

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
          // Usar siempre el precio de la base de datos
          const servicePrice = service?.price ?? null;
          return {
            ...row,
            serviceId: trimmed,
            unitPrice: typeof servicePrice === 'number' && Number.isFinite(servicePrice) ? String(servicePrice) : '',
          };
        }

        if (key === 'quantity') {
          const sanitized = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
          return { ...row, quantity: sanitized };
        }

        // El precio unitario ya no es editable, se toma de la BD
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

    if (rows.length === 0) {
      setError('Agrega al menos un servicio a la cotización.');
      return;
    }

    const servicesPayload: CreateClientQuoteInput['services'] = [];

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

    const payload: CreateClientQuoteInput = {
      services: servicesPayload,
    };

    const trimmedDescription = description.trim();
    if (trimmedDescription.length > 0) {
      payload.description = trimmedDescription;
    }

    try {
      await onSubmit(payload);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'No fue posible guardar la cotización.';
      setError(message);
    }
  };

  const canSubmit = !loading && !submitting && services.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {defaultValue ? 'Editar cotización' : 'Nueva cotización'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          Cancelar
        </button>
      </div>

      {errorMessage
        ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {errorMessage}
            </div>
          )
        : null}

      {error
        ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          )
        : null}

      {loading
        ? (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
              Cargando información de servicios…
            </div>
          )
        : null}

      <label className="flex flex-col gap-1 text-sm text-gray-700">
        <span className="font-medium">Descripción</span>
        <textarea
          value={description}
          onChange={event => setDescription(event.target.value)}
          placeholder="Descripción de la cotización (opcional)"
          rows={3}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
        />
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Servicios incluidos</h3>
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1 rounded-full border border-primary-200 px-3 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-50"
            disabled={loading || services.length === 0}
          >
            <Plus className="h-3 w-3" />
            Agregar servicio
          </button>
        </div>

        <div className="space-y-3">
          {rows.map((row, index) => {
            const total = computedTotals[index];
            const formattedTotal = Number.isFinite(total) ? formatCurrency(total, locale) : '—';
            const selectedService = serviceMap.get(row.serviceId);
            const serviceUnit = selectedService?.unit ?? null;

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

                  <label className="flex w-full max-w-[120px] flex-col gap-1 text-xs text-gray-700">
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

                  <label className="flex w-full max-w-[140px] flex-col gap-1 text-xs text-gray-700">
                    <span className="font-medium">Precio unitario</span>
                    <input
                      type="text"
                      value={row.unitPrice ? formatCurrency(parseNumber(row.unitPrice), locale) : '—'}
                      readOnly
                      disabled
                      className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                      title="El precio se obtiene automáticamente del servicio"
                    />
                  </label>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-3">
                    {serviceUnit && (
                      <span className="text-xs text-gray-500">
                        <span className="font-medium">Unidad:</span>
                        {' '}
                        {serviceUnit}
                      </span>
                    )}
                    <span>
                      <span className="font-medium">Total:</span>
                      {' '}
                      <span className="font-semibold text-gray-900">{formattedTotal}</span>
                    </span>
                  </div>
                  {rows.length > 1
                    ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline"
                        >
                          <Trash2 className="h-3 w-3" />
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
          disabled={submitting}
          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {defaultValue ? 'Actualizando…' : 'Creando…'}
                </>
              )
            : (
                <>{defaultValue ? 'Actualizar cotización' : 'Crear cotización'}</>
              )}
        </button>
      </div>
    </form>
  );
}
