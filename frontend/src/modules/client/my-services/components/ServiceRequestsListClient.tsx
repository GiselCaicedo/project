'use client';

import type { ServiceRequestRecord } from '@admin/services/requests/types';
import type { ColDef } from 'ag-grid-community';
import PageHeader from '@shared/components/common/PageHeader';
import AgTable from '@shared/components/datagrid/AgTable';
import { CheckCircle2, Circle, Plus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

type Props = {
  initialRequests: ServiceRequestRecord[];
  initialError?: string | null;
};

export default function ServiceRequestsListClient({ initialRequests, initialError = null }: Props) {
  const { locale } = useParams() as { locale: string };
  const router = useRouter();

  const [requests] = useState<ServiceRequestRecord[]>(() => initialRequests.map(r => ({ ...r })));
  const [errorMessage] = useState<string | null>(initialError);
  const [quickFilter, setQuickFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'abierto' | 'proceso' | 'cerrado'>('todas');

  const breadcrumbs = useMemo(() => [
    { label: 'Panel Cliente', href: `/${locale}/client/dashboard` },
    { label: 'Mis Servicios', href: `/${locale}/client/my_services` },
    { label: 'Solicitudes' },
  ], [locale]);

  const columns = useMemo<ColDef<ServiceRequestRecord>[]>(() => [
    {
      headerName: 'Fecha', field: 'createdAt', width: 160, valueFormatter: (p) => {
        const v = p.value as string | null; if (!v) {
          return '';
        } const d = new Date(v); return Number.isNaN(d.getTime()) ? v : d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
      }
    },
    { headerName: 'Servicio', valueGetter: p => p.data?.service?.name ?? '-', flex: 1, minWidth: 160 },
    { headerName: 'Descripción', field: 'description', flex: 2, minWidth: 220 },
    {
      headerName: 'Estado',
      field: 'status',
      headerClass: 'flex justify-center',
      width: 160,
      cellRenderer: (p) => {
        const raw = (p.data?.status ?? '').toString();
        const normalized = raw as 'abierto' | 'proceso' | 'cerrado';
        const tone = normalized === 'cerrado'
          ? 'bg-emerald-50 text-emerald-700'
          : normalized === 'proceso'
            ? 'bg-amber-50 text-amber-700'
            : 'bg-blue-50 text-blue-700';
        const icon = normalized === 'cerrado' ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />;
        const label = normalized === 'cerrado' ? 'Cerrada' : normalized === 'proceso' ? 'En Proceso' : 'Abierta';

        return (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${tone}`}>
            {icon}
            {label}
          </span>
        );
      },
      cellClass: 'justify-center'
    },
 
  ], []);

  const action = (
    <button
      type="button"
      onClick={() => router.push(`/${locale}/client/my_services/request`)}
      className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
    >
      <Plus className="h-4 w-4" />
      Nueva solicitud
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Mis Solicitudes de Servicio"
        description="Crea y consulta el estado de tus solicitudes de servicios."
        actions={action}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <input
            type="search"
            value={quickFilter}
            onChange={e => setQuickFilter(e.target.value)}
            placeholder="Buscar por servicio o descripción"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-3 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
          />
        </div>
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
      />
    </div>
  );
}
