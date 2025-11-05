'use client';

import type { InvoiceObservation } from '@shared/services/conexion';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import {
  createAdminInvoiceObservationApi,
  deleteAdminInvoiceObservationApi,
  getAdminInvoiceObservationsApi,
  updateAdminInvoiceObservationApi,
} from '@shared/services/conexion';
import { Edit2, Loader2, Plus, Send, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

function formatDate(s: string | null | undefined) {
  if (!s) {
    return '';
  }
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

export default function InvoiceObservations({ invoiceId }: { invoiceId: string }) {
  const { notify } = useAlerts();
  const [observations, setObservations] = useState<InvoiceObservation[]>([]);
  const [newObservation, setNewObservation] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadObservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const loadObservations = async () => {
    setLoading(true);
    try {
      const data = await getAdminInvoiceObservationsApi(invoiceId);
      setObservations(data || []);
    } catch (error) {
      console.error('InvoiceObservations load error', error);
      notify({ type: 'error', title: 'Error al cargar observaciones' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObservation.trim()) {
      notify({ type: 'error', title: 'La observación no puede estar vacía' });
      return;
    }
    setSubmitting(true);
    try {
      const data = await createAdminInvoiceObservationApi(invoiceId, newObservation.trim());
      setObservations(prev => [data, ...prev]);
      setNewObservation('');
      setShowForm(false);
      notify({ type: 'success', title: 'Observación agregada' });
    } catch (error) {
      console.error('InvoiceObservations create error', error);
      notify({ type: 'error', title: 'No fue posible crear la observación' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (observationId: string) => {
    if (!editContent.trim()) {
      notify({ type: 'error', title: 'La observación no puede estar vacía' });
      return;
    }
    setSubmitting(true);
    try {
      const data = await updateAdminInvoiceObservationApi(observationId, editContent.trim());
      setObservations(prev => prev.map(o => (o.id === observationId ? data : o)));
      setEditingId(null);
      setEditContent('');
      notify({ type: 'success', title: 'Observación actualizada' });
    } catch (error) {
      console.error('InvoiceObservations update error', error);
      notify({ type: 'error', title: 'No fue posible actualizar la observación' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (observationId: string) => {
    const confirmed = window.confirm('¿Eliminar esta observación?');
    if (!confirmed) {
      return;
    }
    setSubmitting(true);
    try {
      await deleteAdminInvoiceObservationApi(observationId);
      setObservations(prev => prev.filter(o => o.id !== observationId));
      notify({ type: 'success', title: 'Observación eliminada' });
    } catch (error) {
      console.error('InvoiceObservations delete error', error);
      notify({ type: 'error', title: 'No fue posible eliminar la observación' });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (obs: InvoiceObservation) => {
    setEditingId(obs.id);
    setEditContent(obs.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Observaciones</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {observations.length}
            {' '}
            observación(es)
          </span>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-600"
          >
            <Plus className="h-4 w-4" />
            {' '}
            Nueva
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-4 mb-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <textarea
            value={newObservation}
            onChange={e => setNewObservation(e.target.value)}
            rows={3}
            placeholder="Escribe una observación..."
            disabled={submitting}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none disabled:opacity-50"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setNewObservation('');
              }}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !newObservation.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {' '}
              Agregar
            </button>
          </div>
        </form>
      )}

      {loading
        ? (
            <div className="py-6 text-sm text-gray-500">Cargando...</div>
          )
        : observations.length === 0
          ? (
              <p className="mt-2 text-sm text-gray-500">Sin observaciones.</p>
            )
          : (
              <ul className="mt-3 space-y-2">
                {observations.map(obs => (
                  <li key={obs.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    {editingId === obs.id
                      ? (
                          <div>
                            <textarea
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              rows={3}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                            />
                            <div className="mt-2 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={submitting}
                                className="rounded p-1 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdate(obs.id)}
                                disabled={submitting || !editContent.trim()}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
                              >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                {' '}
                                Guardar
                              </button>
                            </div>
                          </div>
                        )
                      : (
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-wrap text-gray-800">{obs.content}</p>
                              <p className="mt-1 text-xs text-gray-500">{formatDate((obs as any).created)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEdit(obs)}
                                  disabled={submitting}
                                  title="Editar"
                                  className="rounded p-1 text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700 disabled:opacity-50"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(obs.id)}
                                  disabled={submitting}
                                  title="Eliminar"
                                  className="rounded p-1 text-rose-500 hover:bg-rose-100 hover:text-rose-700 disabled:opacity-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                  </li>
                ))}
              </ul>
            )}
    </section>
  );
}
