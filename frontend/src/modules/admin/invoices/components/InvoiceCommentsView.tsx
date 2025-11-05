'use client';

import { useAlerts } from '@shared/components/common/AlertsProvider';
import { getAdminInvoiceCommentsApi } from '@shared/services/conexion';
import { useEffect, useState } from 'react';

export default function InvoiceCommentsView({ invoiceId }: { invoiceId: string }) {
  const { notify } = useAlerts();
  const [rows, setRows] = useState<Array<{ id: string; content: string; created: string | null }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getAdminInvoiceCommentsApi(invoiceId);
        setRows((data || []).map(d => ({ id: d.id, content: d.content, created: d.created })));
      } catch (error) {
        console.error('InvoiceCommentsView load error', error);
        notify({ type: 'error', title: 'Error al cargar comentarios' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [invoiceId]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
        Comentarios
      </h2>

      {loading
        ? (
            <div className="py-4 text-sm text-gray-500">Cargando...</div>
          )
        : rows.length === 0
          ? (
              <p className="mt-2 text-sm text-gray-500">Sin comentarios.</p>
            )
          : (
              <ul className="mt-4 space-y-2">
                {rows.map(r => (
                  <li key={r.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-sm whitespace-pre-wrap text-gray-800">{r.content}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatDate(r.created)}</p>
                  </li>
                ))}
              </ul>
            )}
    </section>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return '-';
  }
  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
