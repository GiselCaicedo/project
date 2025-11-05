'use client';

import type { BackendUser } from '@shared/services/conexion';
import type { ColDef } from 'ag-grid-community';
import AgTable from '@shared/components/datagrid/AgTable';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import ConfirmDialog from '@shared/components/common/ConfirmDialog';
import SidePanel from '@shared/components/common/SidePanel';
import CreateUserForm from '@shared/components/settings/CreateUserForm';
import EditUserForm from '@shared/components/settings/EditUserForm';
import { deleteUserApi, getUsersApi } from '@shared/services/conexion';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function ClientUsersPanel() {
  const { notify } = useAlerts();
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsersApi();
      setUsers(data);
    } catch (error: any) {
      notify({
        type: 'error',
        title: 'Error',
        description: error?.message || 'No se pudieron cargar los usuarios',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async () => {
    if (!deletingUserId) {
      return;
    }

    try {
      await deleteUserApi(deletingUserId);
      notify({
        type: 'success',
        title: 'Usuario eliminado',
        description: 'El usuario ha sido eliminado correctamente',
      });
      setDeletingUserId(null);
      loadUsers();
    } catch (error: any) {
      notify({
        type: 'error',
        title: 'Error',
        description: error?.message || 'No se pudo eliminar el usuario',
      });
    }
  };

  const columns: ColDef<BackendUser>[] = useMemo(
    () => [
      {
        headerName: 'Usuario',
        field: 'user',
        flex: 1,
        minWidth: 150,
        valueGetter: params => params.data?.user || params.data?.usuario || '-',
      },
      {
        headerName: 'Nombre',
        field: 'name',
        flex: 1.5,
        minWidth: 200,
        valueGetter: params => params.data?.name || '-',
      },
      {
        headerName: 'Rol',
        field: 'role.name',
        flex: 1,
        minWidth: 150,
        valueGetter: params => params.data?.role?.name || '-',
      },
      {
        headerName: 'Estado',
        field: 'status',
        minWidth: 120,
        cellRenderer: (params: any) => {
          const isActive = params.data?.status;
          return (
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {isActive ? 'Activo' : 'Inactivo'}
            </span>
          );
        },
      },
      {
        headerName: 'Acciones',
        minWidth: 130,
        maxWidth: 130,
        cellClass: 'flex items-center justify-center gap-2',
        cellRenderer: (params: any) => {
          const userId = params.data?.id;
          if (!userId) return null;

          return (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setEditingUserId(userId)}
                className="rounded p-1 text-blue-600 hover:bg-blue-50"
                title="Editar usuario"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeletingUserId(userId)}
                className="rounded p-1 text-red-600 hover:bg-red-50"
                title="Eliminar usuario"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Usuarios Internos</h2>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona los usuarios que tienen acceso a tu cuenta
          </p>
        </div>
        <button
          onClick={() => setShowCreatePanel(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Crear Usuario
        </button>
      </div>

      {loading
        ? (
            <div className="py-12 text-center text-gray-500">
              Cargando usuarios...
            </div>
          )
        : users.length === 0
          ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">No hay usuarios registrados</p>
                <button
                  onClick={() => setShowCreatePanel(true)}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700"
                >
                  Crear el primer usuario
                </button>
              </div>
            )
          : (
              <AgTable<BackendUser>
                rows={users}
                columns={columns}
                getRowId={row => row.id}
                height={Math.min(600, (users.length + 1) * 46 + 60)}
                pageSize={10}
              />
            )}

      <SidePanel
        open={showCreatePanel}
        onClose={() => setShowCreatePanel(false)}
        title="Crear Usuario"
      >
        <CreateUserForm
          onClose={() => setShowCreatePanel(false)}
          onSuccess={() => {
            setShowCreatePanel(false);
            loadUsers();
          }}
        />
      </SidePanel>

      <SidePanel
        open={!!editingUserId}
        onClose={() => setEditingUserId(null)}
        title="Editar Usuario"
      >
        {editingUserId && (
          <EditUserForm
            userId={editingUserId}
            onCancel={() => setEditingUserId(null)}
            onSuccess={() => {
              setEditingUserId(null);
              loadUsers();
            }}
          />
        )}
      </SidePanel>

      <ConfirmDialog
        open={!!deletingUserId}
        onClose={() => setDeletingUserId(null)}
        onConfirm={handleDelete}
        title="Eliminar Usuario"
        message="¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}
