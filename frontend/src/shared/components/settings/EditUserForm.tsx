'use client';

import { useEffect, useState } from 'react';
import type { BackendUser, Role, Client } from '@shared/services/conexion';
import { getUserByIdApi, updateUserApi, getRolesApi, getClientsApi } from '@shared/services/conexion';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import { useTranslations } from 'next-intl';

type Props = {
  userId: string;
  onCancel?: () => void;
  onSuccess?: () => void;
};

export default function EditUserForm({ userId, onCancel, onSuccess }: Props) {
  const { notify } = useAlerts();
  const t = useTranslations('Users.EditForm');
  const [user, setUser] = useState<BackendUser | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [business, setBusiness] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [status, setStatus] = useState(true);
  const [password, setPassword] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [u, r, b] = await Promise.all([
          getUserByIdApi(userId),
          getRolesApi(),
          getClientsApi(),
        ]);
        setUser(u);
        setRoles(r);
        setBusiness(b);

        setName(u.name || '');
        const initialRole = (u as any).role_id ?? u.role?.id ?? '';
        setRoleId(initialRole ? String(initialRole) : '');
        setStatus(!!u.status);
        setErr(null);
      } catch (e: any) {
        const message = e?.message || 'Error al cargar usuario';
        setErr(message);
        notify({ type: 'error', title: 'Error de carga', description: message });
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, notify]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await updateUserApi(userId, {
        name,
        role_id: roleId || undefined,
        status,
        password: password || undefined,
      });
      if (!response.success) {
        notify({ type: 'error', title: 'Error al actualizar', description: response.message || 'No se pudo actualizar el usuario' });
        return;
      }
      notify({ type: 'success', title: 'Usuario actualizado', description: 'El usuario ha sido actualizado correctamente' });
      onSuccess?.();
    } catch (e: any) {
      notify({ type: 'error', title: 'Error al actualizar', description: e?.message || 'Error inesperado' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pl-2 text-sm text-gray-600">Cargando...</div>;
  if (err) return <div className="text-sm text-red-600">{err}</div>;
  if (!user) return null;

  const statusLabel = status ? 'Activo' : 'Inactivo';

  return (
    <form onSubmit={submit} className="p-5 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Usuario</label>
       <input
          value={user.user || (user as any).usuario || ''}
          disabled
          className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
          placeholder="Nombre completo"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Rol</label>
        <select
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
          required
        >
          <option value="" disabled>Seleccionar rol</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="status"
          type="checkbox"
          checked={status}
          onChange={(e) => setStatus(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="status" className="text-sm text-gray-700 select-none">{statusLabel}</label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nueva contraseña
          <span className="ml-1 text-xs text-gray-500">(dejar vacío para no cambiar)</span>
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
          placeholder="Nueva contraseña (opcional)"
          minLength={8}
        />
      </div>

      <div className="pt-2 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
