'use client';

import { MessageSquare } from 'lucide-react';

type QuoteComment = {
  id: string;
  quoteId: string;
  userId: string | null;
  content: string;
  created: string | null;
  updated: string | null;
  status: boolean | null;
};

type Props = {
  comments: QuoteComment[];
};

export default function QuoteCommentsView({ comments }: Props) {
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

  if (comments.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-green-900">
          Comentarios del cliente
        </h2>
        <span className="text-xs text-green-600">
          {comments.length}
          {' '}
          comentario(s)
        </span>
      </div>

      <div className="space-y-3">
        {comments.map(comment => (
          <div key={comment.id} className="rounded-lg border border-green-200 bg-white p-4">
            <p className="mb-2 text-sm whitespace-pre-wrap text-gray-700">{comment.content}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>
                Fecha:
                {formatDate(comment.created)}
              </span>
              {comment.updated && comment.updated !== comment.created && (
                <span>
                  Actualizado:
                  {formatDate(comment.updated)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-green-200 bg-white p-3">
        <p className="text-xs text-green-700">
          <strong>Nota:</strong>
          {' '}
          Los comentarios provienen del panel del cliente y son solo de lectura.
        </p>
      </div>
    </section>
  );
}
