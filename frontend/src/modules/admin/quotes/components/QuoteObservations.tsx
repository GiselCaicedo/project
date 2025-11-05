'use client';

import type { QuoteObservation } from '../types';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import {
  createAdminQuoteObservationApi,
  deleteAdminQuoteObservationApi,
  getAdminQuoteObservationsApi,
  updateAdminQuoteObservationApi,
} from '@shared/services/conexion';
import { Edit2, FileText, Loader2, Plus, Send, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type Props = {
  quoteId: string;
  initialObservations?: QuoteObservation[];
};

export default function QuoteObservations({ quoteId, initialObservations = [] }: Props) {
  const { notify } = useAlerts();
  const [observations, setObservations] = useState<QuoteObservation[]>(initialObservations);
  const [newObservation, setNewObservation] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadObservations();
  }, [quoteId]);

  const loadObservations = async () => {
    setLoading(true);
    try {
      const data = await getAdminQuoteObservationsApi(quoteId);
      setObservations(data || []);
    } catch (error) {
      console.error('Error loading observations:', error);
      notify({
        type: 'error',
        title: 'Error al cargar observaciones',
        message: error instanceof Error ? error.message : 'No fue posible cargar las observaciones',
      });
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
      const data = await createAdminQuoteObservationApi(quoteId, newObservation.trim());
      setObservations(prev => [data, ...prev]);
      setNewObservation('');
      setShowForm(false);
      notify({ type: 'success', title: 'Observación agregada correctamente' });
    } catch (error) {
      console.error('Error creating observation:', error);
      notify({
        type: 'error',
        title: 'Error al crear observación',
        message: error instanceof Error ? error.message : 'No fue posible crear la observación',
      });
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
      const data = await updateAdminQuoteObservationApi(observationId, editContent.trim());
      setObservations(prev => prev.map(o => o.id === observationId ? data : o));
      setEditingId(null);
      setEditContent('');
      notify({ type: 'success', title: 'Observación actualizada correctamente' });
    } catch (error) {
      console.error('Error updating observation:', error);
      notify({
        type: 'error',
        title: 'Error al actualizar observación',
        message: error instanceof Error ? error.message : 'No fue posible actualizar la observación',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (observationId: string) => {
    const confirmed = window.confirm('¿Está seguro de eliminar esta observación?');
    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    try {
      await deleteAdminQuoteObservationApi(observationId);
      setObservations(prev => prev.filter(o => o.id !== observationId));
      notify({ type: 'success', title: 'Observación eliminada correctamente' });
    } catch (error) {
      console.error('Error deleting observation:', error);
      notify({
        type: 'error',
        title: 'Error al eliminar observación',
        message: error instanceof Error ? error.message : 'No fue posible eliminar la observación',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (observation: QuoteObservation) => {
    setEditingId(observation.id);
    setEditContent(observation.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

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

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          Observaciones
        </h2>
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
            Nueva
          </button>
        </div>
      </div>

      {/* Formulario crear observación */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 space-y-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
          <textarea
            value={newObservation}
            onChange={e => setNewObservation(e.target.value)}
            placeholder="Escribe una observación..."
            rows={3}
            disabled={submitting}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none disabled:opacity-50"
            autoFocus
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
              {submitting
                ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )
                : (
                    <Send className="h-4 w-4" />
                  )}
              Agregar observación
            </button>
          </div>
        </form>
      )}

      {/* Lista de observaciones */}
      {loading
        ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            </div>
          )
        : observations.length === 0
          ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <FileText className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No hay observaciones aún</p>
                <p className="mt-1 text-xs text-gray-400">Agrega observaciones internas sobre esta cotización</p>
              </div>
            )
          : (
              <div className="space-y-4">
                {observations.map(observation => (
                  <div key={observation.id} className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                    {editingId === observation.id
                      ? (
                          <div className="space-y-3">
                            <textarea
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              rows={3}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={submitting}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdate(observation.id)}
                                disabled={submitting || !editContent.trim()}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
                              >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Guardar
                              </button>
                            </div>
                          </div>
                        )
                      : (
                          <>
                            <div className="mb-2 flex items-start justify-between gap-4">
                              <p className="flex-1 text-sm whitespace-pre-wrap text-gray-700">{observation.content}</p>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEdit(observation)}
                                  disabled={submitting}
                                  className="rounded p-1 text-indigo-400 hover:bg-indigo-200 hover:text-indigo-600 disabled:opacity-50"
                                  title="Editar"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(observation.id)}
                                  disabled={submitting}
                                  className="rounded p-1 text-indigo-400 hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-indigo-600">
                              <span>
                                Creado:
                                {formatDate(observation.created)}
                              </span>
                              {observation.updated && observation.updated !== observation.created && (
                                <span>
                                  Editado:
                                  {formatDate(observation.updated)}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                  </div>
                ))}
              </div>
            )}
    </section>
  );
}
