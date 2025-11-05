'use client';

import type { QuoteDetail, QuoteServiceInput } from '@admin/quotes/types';
import type { ServiceRecord } from '@admin/services/types';
import { Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type ServiceRow = { id: string; serviceId: string; quantity: string; unitPrice: string };

const createRow = (index = 0): ServiceRow => ({
  id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `row-${Date.now()}-${index}`,
  serviceId: '',
  quantity: '1',
  unitPrice: '',
});

type Props = {
  quote: QuoteDetail;
  services: ServiceRecord[];
  submitting?: boolean;
  onSubmit: (services: QuoteServiceInput[]) => Promise<void>;
};

const parseNumber = (value: string): number => {
  const normalized = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

export default function QuoteServicesEditor({ quote, services, submitting = false, onSubmit }: Props) {
  const [rows, setRows] = useState<ServiceRow[]>(() => {
    if (!quote?.services || quote.services.length === 0) return [createRow()];
    return quote.services.map((s, index) => ({
      id: s.id || `row-${index}`,
      serviceId: s.serviceId ?? '',
      quantity: String(s.quantity ?? 1),
      unitPrice:
        Number.isFinite(Number(s.total)) && Number.isFinite(Number(s.quantity)) && Number(s.quantity) > 0
          ? (Number(s.total) / Number(s.quantity)).toFixed(2)
          : '',
    }));
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(() => {
      if (!quote?.services || quote.services.length === 0) return [createRow()];
      return quote.services.map((s, index) => ({
        id: s.id || `row-${index}`,
        serviceId: s.serviceId ?? '',
        quantity: String(s.quantity ?? 1),
        unitPrice:
          Number.isFinite(Number(s.total)) && Number.isFinite(Number(s.quantity)) && Number(s.quantity) > 0
            ? (Number(s.total) / Number(s.quantity)).toFixed(2)
            : '',
      }));
    });
    setError(null);
  }, [quote]);

  // Incluir en el catÃ¡logo aquellos servicios ya asociados a la cotizaciÃ³n aunque no vengan en la lista
  const mergedServices = useMemo(() => {
    const map = new Map<string, ServiceRecord>();
    for (const s of services) map.set(s.id, s);
    for (const s of quote.services) {
      const id = s.serviceId ?? '';
      if (id && !map.has(id)) {
        map.set(id, {
          id,
          name: s.serviceName,
          description: null,
          unit: null,
          price: null,
          subtotal: null,
          frequency: null,
          startDate: null,
          endDate: null,
          taxOne: null,
          taxTwo: null,
          status: 'active',
          category: null,
          createdAt: null,
          updatedAt: null,
          clientsCount: 0,
        } as ServiceRecord);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [services, quote.services]);

  const serviceMap = useMemo(() => new Map(mergedServices.map(s => [s.id, s])), [mergedServices]);

  const updateRow = (id: string, updater: (row: ServiceRow) => ServiceRow) => {
    setRows(current => current.map(r => {
      if (r.id !== id) return r;
      const updated = updater(r);

      // Si cambió el serviceId, autocompletar precio desde la tabla service
      if (updated.serviceId !== r.serviceId && updated.serviceId.trim()) {
        const service = serviceMap.get(updated.serviceId);
        // Priorizar subtotal sobre price (igual que el backend)
        const defaultPrice = service?.subtotal ?? service?.price ?? null;
        // Actualizar el precio siempre que haya un precio disponible en el servicio
        if (typeof defaultPrice === 'number' && Number.isFinite(defaultPrice)) {
          updated.unitPrice = String(defaultPrice);
        } else {
          // Si no hay precio en el servicio, limpiar el campo
          updated.unitPrice = '';
        }
      }

      return updated;
    }));
  };

  const addRow = () => setRows(current => [...current, createRow(current.length)]);
  const removeRow = (id: string) => setRows(current => (current.length <= 1 ? current : current.filter(r => r.id !== id)));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const payload: QuoteServiceInput[] = [];
    for (const row of rows) {
      const serviceId = row.serviceId.trim();
      if (!serviceId) {
        setError('Cada fila debe tener un servicio.');
        return;
      }
      if (!serviceMap.has(serviceId)) {
        setError('Servicio inválida.');
        return;
      }
      const quantity = parseNumber(row.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        setError('Cantidad inválida.');
        return;
      }

      // Parsear unitPrice si existe
      const unitPrice = row.unitPrice.trim() ? parseNumber(row.unitPrice) : null;
      if (unitPrice !== null && (!Number.isFinite(unitPrice) || unitPrice < 0)) {
        setError('Precio unitario inválido.');
        return;
      }

      payload.push({
        serviceId,
        quantity,
        unitPrice: unitPrice !== null ? unitPrice : undefined
      });
    }
    try {
      await onSubmit(payload);
    } catch (submitError: any) {
      const message = submitError instanceof Error ? submitError.message : 'No fue posible guardar los servicios.';
      setError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
      <h3 className="text-base font-semibold text-gray-900">Servicios</h3>
      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-12 gap-3">
            <div className="col-span-6">
              <label className="mb-1 block text-xs font-medium text-gray-600">Servicio</label>
              <select
                value={row.serviceId}
                onChange={e => updateRow(row.id, r => ({ ...r, serviceId: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
              >
                <option value="">Seleccionar</option>
                {mergedServices.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Cantidad</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={row.quantity}
                onChange={e => updateRow(row.id, r => ({ ...r, quantity: e.target.value.replace(/[^0-9.,-]/g, '').replace(',', '.') }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
              />
            </div>
            <div className="col-span-3">
              <label className="mb-1 block text-xs font-medium text-gray-600">Precio unitario</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={row.unitPrice}
                onChange={e => updateRow(row.id, r => ({ ...r, unitPrice: e.target.value.replace(/[^0-9.,-]/g, '').replace(',', '.') }))}
                placeholder="0.00"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
                title="Precio base del servicio"
              />
            </div>

            <div className="col-span-1 flex items-center mt-4">
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="rounded-md border border-red-200 px-2 py-1 my-2 text-xs text-red-600 hover:bg-red-200"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        <div>
          <button
            type="button"
            onClick={addRow}
            className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            Añadir servicio
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full border border-primary-200 bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Guardandoâ€¦' : 'Guardar servicios'}
        </button>
      </div>
    </form>
  );
}


