'use client';

import type { PaymentMethodSummary } from '@app/modules/client/payments/types';
import PageHeader from '@shared/components/common/PageHeader';
import { useMemo, useState } from 'react';

type Props = {
  initialMethods: PaymentMethodSummary[];
  locale: string;
};

export default function ClientPaymentMethodsManager({ initialMethods, locale }: Props) {
  const [methods, setMethods] = useState<PaymentMethodSummary[]>(() => initialMethods.map(m => ({ ...m })));
  const [name, setName] = useState('');

  const breadcrumbs = useMemo(() => ([
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Métodos de pago' },
  ]), [locale]);

  const addMethod = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    const id = `mock-${Date.now().toString(36)}`;
    setMethods(prev => [...prev, { id, name: trimmed }]);
    setName('');
  };

  const removeMethod = (id: string) => {
    setMethods(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      <PageHeader breadcrumbs={breadcrumbs} title="Métodos de pago" description="Agrega o elimina métodos de pago (mock)." />

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre del método"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
          />
          <button
            type="button"
            onClick={addMethod}
            className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Agregar
          </button>
        </div>
      </section>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {methods.map(m => (
          <li key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-800">
            <span className="font-medium text-gray-900">{m.name}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => removeMethod(m.id)}
                className="inline-flex items-center rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
        {methods.length === 0 && (
          <li className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
            No hay métodos disponibles.
          </li>
        )}
      </ul>

      <p className="text-xs text-gray-500">Nota: Esta sección es solo de demostración (sin persistencia).</p>
    </div>
  );
}
