'use client';

import type { QuoteDetail, QuoteStatus, UpdateQuoteInput } from '@admin/quotes/types';
import { useEffect, useState } from 'react';

const STATUS_OPTIONS: QuoteStatus[] = ['pendiente', 'aprobada', 'rechazada'];

const parseAmount = (value: string): number => {
  const normalized = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

type QuoteEditFormProps = {
  quote: QuoteDetail;
  submitting?: boolean;
  onSubmit: (payload: UpdateQuoteInput) => Promise<void>;
  onCancel: () => void;
};

export default function QuoteEditForm({ quote, submitting = false, onSubmit, onCancel }: QuoteEditFormProps) {
  const [description, setDescription] = useState(quote.description ?? '');
  const [status, setStatus] = useState<QuoteStatus>(quote.status);
  const [amount, setAmount] = useState(quote.amount.toFixed(2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDescription(quote.description ?? '');
    setStatus(quote.status);
    setAmount(quote.amount.toFixed(2));
    setError(null);
  }, [quote]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsedAmount = parseAmount(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setError('Indica un monto válido para la cotización.');
      return;
    }

    const payload: UpdateQuoteInput = {
      description: description.trim().length > 0 ? description.trim() : null,
      status,
      amount: parsedAmount,
    };

    try {
      await onSubmit(payload);
    } catch (submitError: any) {
      const message = submitError instanceof Error ? submitError.message : 'No fue posible actualizar la cotización.';
      setError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-5">
    

      {error
        ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          )
        : null}

      <label className="flex flex-col gap-1 text-sm text-gray-700">
        <span className="font-medium">Descripción</span>
        <input
          type="text"
          value={description}
          onChange={event => setDescription(event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
          placeholder="Descripción de la cotización"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-700">
        <span className="font-medium">Estado</span>
        <select
          value={status}
          onChange={event => setStatus(event.target.value as QuoteStatus)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option} value={option}>
              {option === 'pendiente' ? 'Pendiente' : option === 'aprobada' ? 'Aprobada' : 'Rechazada'}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-700">
        <span className="font-medium">Monto</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={event => setAmount(event.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
        />
      </label>

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
          disabled={submitting}
          className="rounded-full border border-primary-200 bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
