'use client';

import type { ClientParameter, ClientRecord, ClientStatus, ClientType } from '@admin/clients/types';
import type { ColDef, GridApi, ICellRendererParams } from 'ag-grid-community';
import type { ClientFormResult } from './ClientFormModal';
import PageHeader from '@shared/components/common/PageHeader';
import SidePanel from '@shared/components/common/SidePanel';
import AgTable from '@shared/components/datagrid/AgTable';
import { createAdminClientApi, deleteAdminClientApi } from '@shared/services/conexion';
import { createDateFormatter, createEnumFormatter } from '@shared/utils/columnFormatters';
import { Eye, Trash2, Users } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import ClientFormModal from './ClientFormModal';
import HeaderUserBar from '@shared/components/common/HeaderUserBar';
import TableFiltersBar from '@shared/components/datagrid/TableFiltersBar';
import DeleteClientModal from './DeleteClientModal';

type ClientListViewProps = {
  initialClients: ClientRecord[];
  initialParameters: ClientParameter[];
  initialError?: string | null;
};

type ClientRow = ClientRecord & {
  parameterValues: Record<string, string>;
};

const statusLabel: Record<ClientStatus, { label: string; tone: string }> = {
  active: { label: 'Activo', tone: 'bg-primary-100 text-primary-700' },
  onboarding: { label: 'Onboarding', tone: 'bg-blue-100 text-blue-700' },
  inactive: { label: 'Inactivo', tone: 'bg-amber-100 text-amber-700' },
};

const typeLabel: Record<ClientType, string> = {
  natural: 'Natural',
  juridica: 'Jurídica',
};

const cloneClientRecord = (client: ClientRecord): ClientRecord => ({
  ...client,
  details: Array.isArray(client.details) ? client.details.map(detail => ({ ...detail })) : [],
  services: Array.isArray(client.services) ? client.services.map(service => ({ ...service })) : [],
  quotes: Array.isArray(client.quotes) ? client.quotes.map(quote => ({ ...quote })) : [],
  payments: Array.isArray(client.payments) ? client.payments.map(payment => ({ ...payment })) : [],
  invoices: Array.isArray(client.invoices) ? client.invoices.map(invoice => ({ ...invoice })) : [],
  reminders: Array.isArray(client.reminders) ? client.reminders.map(reminder => ({ ...reminder })) : [],
});

export default function ClientListView({ initialClients, initialParameters, initialError = null }: ClientListViewProps) {
  const router = useRouter();
  const { locale } = useParams() as { locale: string };
  const [clients, setClients] = useState<ClientRecord[]>(() => initialClients.map(cloneClientRecord));
  const [parameters] = useState<ClientParameter[]>(() => initialParameters.map(parameter => ({ ...parameter })));
  const [quickFilter, setQuickFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);

  const containerRef = useRef<HTMLDivElement>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const rows: ClientRow[] = useMemo(
    () =>
      clients.map((client) => {
        const map: Record<string, string> = {};
        client.details.forEach((detail) => {
          map[detail.parameterId] = detail.value;
        });
        return {
          ...client,
          parameterValues: map,
        };
      }),
    [clients],
  );

  const navigateToDetail = (clientId: string) => {
    router.push(`/${locale}/admin/clients/${clientId}`);
  };

  const handleCreateClient = async (payload: ClientFormResult) => {
    try {
      const result = await createAdminClientApi(payload);
      setClients(prev => [...prev, cloneClientRecord(result.client)]);
      setErrorMessage(null);
    } catch (error: any) {
      console.error('Failed to create client', error);
      const message = error instanceof Error ? error.message : 'No fue posible crear el cliente.';
      setErrorMessage(message);
      throw error instanceof Error ? error : new Error(message);
    }
  };

  const handleDeleteClient = async (_authCode: string) => {
    if (!clientToDelete) {
      return;
    }
    try {
      await deleteAdminClientApi(clientToDelete.id);
      setClients(prev => prev.filter(client => client.id !== clientToDelete.id));
      setClientToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete client', error);
      const message = error instanceof Error ? error.message : 'No fue posible eliminar el cliente.';
      setErrorMessage(message);
      throw error instanceof Error ? error : new Error(message);
    }
  };

  const columns = useMemo<ColDef<ClientRow>[]>(() => {
    const dateFormatter = createDateFormatter(locale);
    const typeFormatter = createEnumFormatter(typeLabel);

    const baseColumns: ColDef<ClientRow>[] = [
      {
        headerName: 'Nombre',
        field: 'name',
        flex: 1.2,
        minWidth: 200,
        cellRenderer: (params: ICellRendererParams<ClientRow>) => (
          <button
            type="button"
            onClick={() => navigateToDetail(params.data.id)}
            className="flex items-center gap-2 text-left text-sm font-semibold text-primary-600 hover:underline"
          >
            <Users className="h-4 w-4" />
            {params.data.name}
          </button>
        ),
      },
      {
        headerName: 'Tipo',
        field: 'type',
        valueFormatter: typeFormatter,
        cellClass: 'text-center justify-center',
      },
      {
        headerName: 'Estado',
        field: 'status',
        minWidth: 140,
        cellRenderer: (params: ICellRendererParams<ClientRow>) => {
          const tone = statusLabel[params.data.status];
          if (!tone) {
            return (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                {params.data.status}
              </span>
            );
          }
          return (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tone.tone}`}>
              {tone.label}
            </span>
          );
        },
        cellClass: 'text-center justify-center',
      },
      {
        headerName: 'Creado',
        field: 'createdAt',
        minWidth: 140,
        valueFormatter: dateFormatter,
        cellClass: 'text-center justify-center',
      },
      {
        headerName: 'Actualizado',
        field: 'updatedAt',
        minWidth: 140,
        valueFormatter: dateFormatter,
        cellClass: 'text-center justify-center',
      },
    ];

    const dynamicColumns: ColDef<ClientRow>[] = parameters.map(parameter => ({
      headerName: parameter.name,
      field: parameter.id,
      minWidth: 160,
      flex: 1,
      valueGetter: params => params.data.parameterValues[parameter.id] ?? '—',
      tooltipValueGetter: params => params.data.parameterValues[parameter.id] ?? '',
    }));

    const actionsColumn: ColDef<ClientRow> = {
      headerName: 'Acciones',
      field: 'actions',
      minWidth: 160,
      maxWidth: 180,
      pinned: 'right',
      suppressMenu: true,
      sortable: false,
      cellRenderer: (params: ICellRendererParams<ClientRow>) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigateToDetail(params.data.id)}
            className="inline-flex items-center gap-1 rounded-full border border-sky-200 px-3 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-50"
          >
            <Eye className="h-3.5 w-3.5" />
            {' '}
          </button>
          <button
            type="button"
            onClick={() => setClientToDelete(params.data)}
            className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {' '}
          </button>
        </div>
      ),
      cellClass: 'text-center justify-center',
    };

    return [...baseColumns, ...dynamicColumns, actionsColumn];
  }, [parameters, locale]);

  const headerDescription = 'Administra clientes, campos personalizados y servicios asociados desde un único módulo.';
  const breadcrumbs = useMemo(
    () => [
      { label: 'Panel de Cliente', href: `/${locale}/admin/dashboard` },
      { label: 'Clientes' },
    ],
    [locale],
  );

  const headerActions = (
    <button
      type="button"
      onClick={() => setIsAddModalOpen(true)}
      className="inline-flex items-center gap-2 rounded-full border border-primary-200 px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
    >
      Crear Cliente
    </button>
  );

  return (
    <div className="space-y-6" ref={containerRef}>


      <PageHeader breadcrumbs={breadcrumbs} title="Gestión de clientes" description={headerDescription} actions={headerActions} />
      <div>
        <div className="mb-3">
          <TableFiltersBar
            value={quickFilter}
            onChange={setQuickFilter}
            onClear={() => {
              setQuickFilter('');
              gridApi?.setFilterModel(null);
            }}
            placeholder="Buscar cliente..."
            rightActions={(
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
            )}
          />
        </div>
        <AgTable<ClientRow>
          rows={rows}
          columns={columns}
          quickFilterText={quickFilter}
          getRowId={data => data.id}
          height={520}
          enableColumnFilters={true}
          onReady={api => setGridApi(api)}
        />
      </div>

      <SidePanel
        open={isAddModalOpen}
        title="Agregar nuevo cliente"
        onClose={() => setIsAddModalOpen(false)}
      >
        <ClientFormModal
          open={isAddModalOpen}
          title="Agregar nuevo cliente"
          submitLabel="Guardar cliente"
          parameters={parameters}
          onSubmit={handleCreateClient}
          onClose={() => setIsAddModalOpen(false)}
        />

      </SidePanel>
      <DeleteClientModal
        open={Boolean(clientToDelete)}
        clientName={clientToDelete?.name ?? ''}
        onConfirm={handleDeleteClient}
        onClose={() => setClientToDelete(null)}
      />
    </div>
  );
}

