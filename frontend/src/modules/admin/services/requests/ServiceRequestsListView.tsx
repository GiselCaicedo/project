'use client';

import type { ColDef, GridApi } from 'ag-grid-community';
import type { ServiceRequestRecord, ServiceRequestStatus } from './types';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import PageHeader from '@shared/components/common/PageHeader';
import AgTable from '@shared/components/datagrid/AgTable';
import { updateAdminServiceRequestStatusApi } from '@shared/services/conexion';
import { CheckCircle2, Circle, Clock, Loader2, Save } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useMemo, useState } from 'react';

type Props = {
  initialRequests: ServiceRequestRecord[];
  initialError?: string | null;
};

export default function ServiceRequestsListView({ initialRequests, initialError = null }: Props) {
  const { locale } = useParams() as { locale: string };
  const { notify } = useAlerts();

  const [requests, setRequests] = useState<ServiceRequestRecord[]>(() => initialRequests.map(r => ({ ...r })));
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState('');
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, ServiceRequestStatus>>({});
  const [pendingNotes, setPendingNotes] = useState<Record<string, string>>({});

  const breadcrumbs = useMemo(
    () => [
      { label: 'Panel Admin', href: `/${locale}/admin/dashboard` },
      { label: 'Servicios', href: `/${locale}/admin/services` },
      { label: 'Solicitudes de Servicios' },
    ],
    [locale],
  );

  const onSelectStatus = (requestId: string, newStatus: ServiceRequestStatus) => {
    setPendingChanges(prev => ({
      ...prev,
      [requestId]: newStatus,
    }));
  };

  const onNotesChange = (requestId: string, notes: string) => {
    setPendingNotes(prev => ({
      ...prev,
      [requestId]: notes,
    }));
  };

  const onSaveStatus = async (req: ServiceRequestRecord) => {
    const newStatus = pendingChanges[req.id];
    const newNotes = pendingNotes[req.id] !== undefined ? pendingNotes[req.id] : req.notes;
    const hasStatusChange = newStatus && req.status !== newStatus;
    const hasNotesChange = newNotes !== req.notes;

    if (!hasStatusChange && !hasNotesChange) {
      return;
    }
    if (loadingId) {
      return;
    }
    try {
      setLoadingId(req.id);
      const updated = await updateAdminServiceRequestStatusApi(req.id, newStatus || req.status, newNotes);
      setRequests(prev => prev.map(r => (r.id === updated.id ? { ...updated } : r)));
      setPendingChanges(prev => {
        const next = { ...prev };
        delete next[req.id];
        return next;
      });
      setPendingNotes(prev => {
        const next = { ...prev };
        delete next[req.id];
        return next;
      });
      setErrorMessage(null);
      const statusLabel = newStatus === 'abierto' ? 'abierta' : newStatus === 'proceso' ? 'en proceso' : 'cerrada';
      notify({
        type: 'success',
        title: 'Actualizado correctamente',
        description: hasStatusChange
          ? `La solicitud fue marcada como ${statusLabel}.`
          : 'Las observaciones fueron actualizadas.',
      });
    } catch (e: any) {
      const message = e?.message ?? 'No fue posible actualizar la solicitud';
      setErrorMessage(message);
      notify({ type: 'error', title: 'Error al actualizar', description: message });
    } finally {
      setLoadingId(null);
    }
  };

  const columns = useMemo<ColDef<ServiceRequestRecord>[]>(() => [
    {
      headerName: 'Fecha',
      field: 'createdAt',
      valueFormatter: (p) => {
        const v = p.value as string | null;
        if (!v) {
          return '';
        }
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? v : d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
      },
      width: 160,
    },
    { headerName: 'Cliente', valueGetter: p => p.data?.client?.name ?? '-', flex: 1, minWidth: 160 },
    { headerName: 'Servicio', valueGetter: p => p.data?.service?.name ?? '-', flex: 1, minWidth: 160 },
    { headerName: 'Descripción', field: 'description', flex: 2, minWidth: 220 },
    {
      headerName: 'Estado',
      field: 'status',
      width: 360,
      cellRenderer: (p) => {
        const row = p.data as ServiceRequestRecord;
        const busy = loadingId === row.id;
        const selectedStatus = pendingChanges[row.id] ?? row.status;
        const hasStatusChange = pendingChanges[row.id] && pendingChanges[row.id] !== row.status;
        const notesDraft = pendingNotes[row.id] ?? row.notes ?? '';
        const hasNotesChange = (pendingNotes[row.id] ?? row.notes ?? '') !== (row.notes ?? '');
        const canSave = (hasStatusChange || hasNotesChange) && !busy;

        return (
          <div className="flex w-full items-start gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => onSelectStatus(row.id, e.target.value as ServiceRequestStatus)}
              disabled={busy}
              className="min-w-40 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="abierto">Abierto</option>
              <option value="proceso">En Proceso</option>
              <option value="cerrado">Cerrado</option>
            </select>

      
            <button
              type="button"
              onClick={() => onSaveStatus(row)}
              disabled={!canSave}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold ${
                canSave ? 'border border-primary-200 text-primary-700 hover:bg-primary-50' : 'border border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              title={busy ? 'Guardando…' : 'Guardar cambios'}
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Guardar
            </button>
          </div>
        );
      },
    },
   
  ], [loadingId, pendingChanges, pendingNotes]);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Solicitudes de Servicios"
        description="Consulta y actualiza el estado de las solicitudes enviadas por los clientes."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <input
            type="search"
            value={quickFilter}
            onChange={e => setQuickFilter(e.target.value)}
            placeholder="Buscar por cliente, servicio o descripción"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-3 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setQuickFilter('');
            gridApi?.setFilterModel(null);
          }}
          className="inline-flex items-center rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Limpiar filtros
        </button>
        {errorMessage && (
          <span className="text-sm font-medium text-rose-600">{errorMessage}</span>
        )}
      </div>

      <AgTable<ServiceRequestRecord>
        rows={requests}
        columns={columns}
        quickFilterText={quickFilter}
        getRowId={r => r.id}
        height={520}
        enableColumnFilters={true}
        onReady={api => setGridApi(api)}
      />
    </div>
  );
}
