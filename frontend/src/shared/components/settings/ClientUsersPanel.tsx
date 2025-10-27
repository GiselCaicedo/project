'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { BackendUser } from '@shared/services/conexion';
import { getUsersApi, deleteUserApi } from '@shared/services/conexion';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import SidePanel from '@shared/components/common/SidePanel';
import CreateUserForm from '@shared/components/settings/CreateUserForm';
import EditUserForm from '@shared/components/settings/EditUserForm';
import ConfirmDialog from '@shared/components/common/ConfirmDialog';

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
    if (!deletingUserId) return;

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

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Cargando usuarios...
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay usuarios registrados</p>
          <button
            onClick={() => setShowCreatePanel(true)}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700"
          >
            Crear el primer usuario
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {user.user || user.usuario || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {user.name || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {user.role?.name || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        user.status
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.status ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingUserId(user.id)}
                        className="rounded p-1 text-blue-600 hover:bg-blue-50"
                        title="Editar usuario"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeletingUserId(user.id)}
                        className="rounded p-1 text-red-600 hover:bg-red-50"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
