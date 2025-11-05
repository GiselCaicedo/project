'use client';

import PageHeader from '@shared/components/common/PageHeader';
import HeaderUserBar from '@shared/components/common/HeaderUserBar';
import { useMemo, useState } from 'react';

type Method = { id: string; name: string };

const DEFAULT_METHODS: Method[] = [
  { id: 'card', name: 'Tarjeta' },
  { id: 'transfer', name: 'Transferencia' },
  { id: 'cash', name: 'Efectivo' },
];

export default function AllowedMethodsView({ locale }: { locale: string }) {
  const [methods, setMethods] = useState<Method[]>(() => DEFAULT_METHODS.map(m => ({ ...m })));
  const [name, setName] = useState('');

  const breadcrumbs = useMemo(() => ([
    { label: 'Panel de Cliente', href: `/${locale}/admin/dashboard` },
    { label: 'Configuración', href: `/${locale}/admin/settings` },
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
      <HeaderUserBar locale={locale} variant="admin" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Métodos de pago permitidos"
        description="Configura métodos disponibles para los usuarios (mock)."
      />

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
            <button
              type="button"
              onClick={() => removeMethod(m.id)}
              className="inline-flex items-center rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
            >
              Eliminar
            </button>
          </li>
        ))}
        {methods.length === 0 && (
          <li className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
            No hay métodos configurados.
          </li>
        )}
      </ul>

      <p className="text-xs text-gray-500">Nota: Esta sección es solo de demostración (sin persistencia).</p>
    </div>
  );
}

