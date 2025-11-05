'use client';

import { Eye } from 'lucide-react';

type QuoteObservation = {
  id: string;
  quoteId: string;
  userId: string | null;
  content: string;
  created: string | null;
  updated: string | null;
  status: boolean | null;
};

type Props = {
  observations: QuoteObservation[];
};

export default function QuoteObservationsView({ observations }: Props) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) {
      return '-';
    }
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }
    return new Intl.DateTimeFormat('es', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (observations.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-blue-900">
          Observaciones del administrador
        </h2>
        <span className="text-xs text-blue-600">
          {observations.length}
          {' '}
          observación(es)
        </span>
      </div>

      <div className="space-y-3">
        {observations.map(observation => (
          <div key={observation.id} className="rounded-lg border border-blue-200 bg-white p-4">
            <p className="mb-2 text-sm whitespace-pre-wrap text-gray-700">{observation.content}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>
                Fecha:
                {formatDate(observation.created)}
              </span>
              {observation.updated && observation.updated !== observation.created && (
                <span>
                  Actualizado:
                  {formatDate(observation.updated)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-blue-200 bg-white p-3">
        <p className="text-xs text-blue-700">
          <strong>Nota:</strong>
          {' '}
          Las observaciones son solo de lectura y provienen del panel de administración.
        </p>
      </div>
    </section>
  );
}
