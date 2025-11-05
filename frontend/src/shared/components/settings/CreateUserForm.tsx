'use client';

import type { Client, Role } from '@shared/services/conexion';
import { Combobox } from '@headlessui/react';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import { getClientsApi, getRolesApi, registerUser } from '@shared/services/conexion';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  onClose?: () => void;
  onSuccess?: () => void;
  defaultBusinessId?: string;
};

type FormData = {
  user: string;
  name: string;
  password: string;
  role_id: string;
  business_id: string;
};

export default function CreateUserForm({ onClose, onSuccess, defaultBusinessId }: Props) {
  const t = useTranslations('Users.CreateForm');
  const { notify } = useAlerts();
  const [form, setForm] = useState<FormData>({
    user: '',
    name: '',
    password: '',
    role_id: '',
    business_id: defaultBusinessId ?? '',
  });

  const [roles, setRoles] = useState<Role[]>([]);
  const [business, setBusiness] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLists, setLoadingLists] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [queryRole, setQueryRole] = useState('');
  const [queryBusiness, setQueryBusiness] = useState('');
  const [formKey, setFormKey] = useState(0);

  const userRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoadingLists(true);
        const [rolesResponse, businessResponse] = await Promise.all([getRolesApi(), getClientsApi()]);
        setRoles(rolesResponse);
        setBusiness(businessResponse);
      } catch (e: any) {
        const message = e?.message || 'Error al cargar listas';
        setError(message);
        notify({ type: 'error', title: 'Error de carga', description: message });
      } finally {
        setLoadingLists(false);
      }
    })();
  }, [notify]);

  useEffect(() => {
    if (defaultBusinessId && !form.business_id) {
      setForm(current => ({ ...current, business_id: defaultBusinessId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultBusinessId]);

  const filteredRoles
    = queryRole === '' ? roles : roles.filter(role => role.name.toLowerCase().includes(queryRole.toLowerCase()));

  const filteredBusiness
    = queryBusiness === '' ? business : business.filter(item => item.name.toLowerCase().includes(queryBusiness.toLowerCase()));

  const valid = useMemo(
    () =>
      form.user.trim().length >= 3
      && form.name.trim().length >= 3
      && form.password.trim().length >= 8
      && !!form.role_id
      && !!form.business_id,
    [form],
  );

  const resetForm = () => {
    setForm({
      user: '',
      name: '',
      password: '',
      role_id: '',
      business_id: defaultBusinessId ?? '',
    });
    setQueryRole('');
    setQueryBusiness('');
    setFormKey(key => key + 1);
    requestAnimationFrame(() => userRef.current?.focus());
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid) {
      notify({
        type: 'warning',
        title: 'Formulario inválido',
        description: 'Por favor completa todos los campos requeridos',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await registerUser({ ...form, status: true });
      const ok
        = response?.success
          ?? response?.ok
          ?? (response as any)?.status === true
          ?? (typeof (response as any)?.statusCode === 'number' && (response as any).statusCode < 300);

      if (ok) {
        notify({ type: 'success', title: 'Usuario creado', description: 'El usuario ha sido creado exitosamente' });
        resetForm();
        onSuccess?.();
      } else {
        notify({ type: 'error', title: 'Error al crear', description: response?.message ?? 'Error inesperado' });
      }
    } catch (error: any) {
      notify({ type: 'error', title: 'Error al crear', description: error?.message ?? 'Error inesperado' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      key={formKey}
      onSubmit={onSubmit}
      className="space-y-4 p-5"
      autoComplete="off"
    >
      <div className="space-y-1">
        <label htmlFor="user" className="block text-sm font-medium">
          Usuario
        </label>
        <input
          ref={userRef}
          id="user"
          name="username"
          type="text"
          value={form.user}
          onChange={event => setForm(current => ({ ...current, user: event.target.value }))}
          required
          autoComplete="username"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
          placeholder="Nombre de usuario"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium">
          Nombre completo
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
          required
          autoComplete="name"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
          placeholder="Nombre completo"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium">
          Contraseña
        </label>
        <input
          id="password"
          name="new-password"
          type="password"
          value={form.password}
          onChange={event => setForm(current => ({ ...current, password: event.target.value }))}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
          placeholder="Mínimo 8 caracteres"
        />
        <p className="text-xs text-gray-500">La contraseña debe tener al menos 8 caracteres</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Rol</label>
          <Combobox
            value={roles.find(role => role.id === form.role_id) ?? null}
            onChange={(value: Role | null) => setForm(current => ({ ...current, role_id: value?.id ?? '' }))}
          >
            <div className="relative">
              <Combobox.Input
                key={`role-${formKey}`}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
                displayValue={(role: Role) => role?.name ?? ''}
                onChange={event => setQueryRole(event.target.value)}
                placeholder="Buscar rol..."
              />
              <Combobox.Options className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg">
                {filteredRoles.length === 0 && <div className="px-3 py-2 text-gray-500">No hay roles disponibles</div>}
                {filteredRoles.map(role => (
                  <Combobox.Option
                    key={role.id}
                    value={role}
                    className={({ active }) =>
                      `cursor-pointer select-none px-3 py-2 text-sm ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-800'}`}
                  >
                    {role.name}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Empresa</label>
          <Combobox
            value={business.find(item => item.id === form.business_id) ?? null}
            onChange={(value: Client | null) => setForm(current => ({ ...current, business_id: value?.id ?? '' }))}
          >
            <div className="relative">
              <Combobox.Input
                key={`business-${formKey}`}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
                displayValue={(item: Client) => item?.name ?? ''}
                onChange={event => setQueryBusiness(event.target.value)}
                placeholder="Buscar empresa..."
              />
              <Combobox.Options className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg">
                {filteredBusiness.length === 0 && <div className="px-3 py-2 text-gray-500">No hay empresas disponibles</div>}
                {filteredBusiness.map(item => (
                  <Combobox.Option
                    key={item.id}
                    value={item}
                    className={({ active }) =>
                      `cursor-pointer select-none px-3 py-2 text-sm ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-800'}`}
                  >
                    {item.name}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {loadingLists && <p className="text-xs text-gray-500">Cargando listas...</p>}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!valid || loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Creando...' : 'Crear'}
        </button>
      </div>
    </form>
  );
}
