'use client';

import type { QuoteComment } from '../types';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import {
  createClientQuoteCommentApi,
  deleteClientQuoteCommentApi,
  getClientQuoteCommentsApi,
  updateClientQuoteCommentApi,
} from '@shared/services/conexion';
import { Edit2, Loader2, MessageSquare, Send, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type Props = {
  quoteId: string;
  initialComments?: QuoteComment[];
};

export default function QuoteComments({ quoteId, initialComments = [] }: Props) {
  const { notify } = useAlerts();
  const [comments, setComments] = useState<QuoteComment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [quoteId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await getClientQuoteCommentsApi(quoteId);
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
      notify({
        type: 'error',
        title: 'Error al cargar comentarios',
        message: error instanceof Error ? error.message : 'No fue posible cargar los comentarios',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      notify({ type: 'error', title: 'El comentario no puede estar vacío' });
      return;
    }

    setSubmitting(true);
    try {
      const data = await createClientQuoteCommentApi(quoteId, newComment.trim());
      setComments(prev => [data, ...prev]);
      setNewComment('');
      notify({ type: 'success', title: 'Comentario agregado correctamente' });
    } catch (error) {
      console.error('Error creating comment:', error);
      notify({
        type: 'error',
        title: 'Error al crear comentario',
        message: error instanceof Error ? error.message : 'No fue posible crear el comentario',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) {
      notify({ type: 'error', title: 'El comentario no puede estar vacío' });
      return;
    }

    setSubmitting(true);
    try {
      const data = await updateClientQuoteCommentApi(commentId, editContent.trim());
      setComments(prev => prev.map(c => c.id === commentId ? data : c));
      setEditingId(null);
      setEditContent('');
      notify({ type: 'success', title: 'Comentario actualizado correctamente' });
    } catch (error) {
      console.error('Error updating comment:', error);
      notify({
        type: 'error',
        title: 'Error al actualizar comentario',
        message: error instanceof Error ? error.message : 'No fue posible actualizar el comentario',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    const confirmed = window.confirm('¿Está seguro de eliminar este comentario?');
    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    try {
      await deleteClientQuoteCommentApi(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      notify({ type: 'success', title: 'Comentario eliminado correctamente' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      notify({
        type: 'error',
        title: 'Error al eliminar comentario',
        message: error instanceof Error ? error.message : 'No fue posible eliminar el comentario',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (comment: QuoteComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
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
          Comentarios
        </h2>
        <span className="text-xs text-gray-500">
          {comments.length}
          {' '}
          comentario(s)
        </span>
      </div>

      {/* Formulario crear comentario */}
      <form onSubmit={handleCreate} className="mb-6 space-y-3">
        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Escribe un comentario..."
          rows={3}
          disabled={submitting}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none disabled:opacity-50"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )
              : (
                  <Send className="h-4 w-4" />
                )}
            Agregar comentario
          </button>
        </div>
      </form>

      {/* Lista de comentarios */}
      {loading
        ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            </div>
          )
        : comments.length === 0
          ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <MessageSquare className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No hay comentarios aún</p>
                <p className="mt-1 text-xs text-gray-400">Sé el primero en comentar</p>
              </div>
            )
          : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    {editingId === comment.id
                      ? (
                          <div className="space-y-3">
                            <textarea
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              rows={3}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none"
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
                                onClick={() => handleUpdate(comment.id)}
                                disabled={submitting || !editContent.trim()}
                                className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
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
                              <p className="flex-1 text-sm whitespace-pre-wrap text-gray-700">{comment.content}</p>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEdit(comment)}
                                  disabled={submitting}
                                  className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-50"
                                  title="Editar"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(comment.id)}
                                  disabled={submitting}
                                  className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 disabled:opacity-50"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>
                                Creado:
                                {formatDate(comment.created)}
                              </span>
                              {comment.updated && comment.updated !== comment.created && (
                                <span>
                                  Editado:
                                  {formatDate(comment.updated)}
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
