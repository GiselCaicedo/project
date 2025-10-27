'use client';

import { useEffect, useState } from 'react';
import { Save, Eye, EyeOff } from 'lucide-react';
import { getUserByIdApi, updateUserApi } from '@shared/services/conexion';
import { useAlerts } from '@shared/components/common/AlertsProvider';

export default function UserProfilePanel() {
  const { notify } = useAlerts();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        // Obtener el ID del usuario actual del storage o context
        const token = typeof window !== 'undefined'
          ? window.sessionStorage.getItem('auth_token') || window.localStorage.getItem('auth_token')
          : null;

        if (!token) {
          throw new Error('No se encontró sesión activa');
        }

        // Decodificar el token para obtener el ID del usuario (básico)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentUserId = payload.sub || payload.userId || payload.id;

        if (!currentUserId) {
          throw new Error('No se pudo identificar al usuario');
        }

        setUserId(currentUserId);

        const user = await getUserByIdApi(currentUserId);
        setFormData({
          username: user.user || user.usuario || '',
          name: user.name || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } catch (error: any) {
        notify({
          type: 'error',
          title: 'Error',
          description: error?.message || 'No se pudo cargar el perfil',
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      notify({
        type: 'error',
        title: 'Error',
        description: 'No se pudo identificar al usuario',
      });
      return;
    }

    // Validar contraseñas si se están cambiando
    if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        notify({
          type: 'warning',
          title: 'Contraseña inválida',
          description: 'La contraseña debe tener al menos 8 caracteres',
        });
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        notify({
          type: 'warning',
          title: 'Contraseñas no coinciden',
          description: 'La nueva contraseña y su confirmación deben ser iguales',
        });
        return;
      }
    }

    try {
      setSaving(true);

      const updateData: any = {
        name: formData.name,
      };

      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      const response = await updateUserApi(userId, updateData);

      if (response.success) {
        notify({
          type: 'success',
          title: 'Perfil actualizado',
          description: 'Tus datos han sido actualizados correctamente',
        });

        // Limpiar campos de contraseña
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      } else {
        notify({
          type: 'error',
          title: 'Error',
          description: response.message || 'No se pudo actualizar el perfil',
        });
      }
    } catch (error: any) {
      notify({
        type: 'error',
        title: 'Error',
        description: error?.message || 'No se pudo actualizar el perfil',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        Cargando perfil...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Configuración del Perfil</h2>
        <p className="mt-1 text-sm text-gray-600">
          Actualiza tu información personal y contraseña
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Usuario
            </label>
            <input
              type="text"
              value={formData.username}
              disabled
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
            <p className="mt-1 text-xs text-gray-500">
              El nombre de usuario no se puede modificar
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre completo
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Tu nombre completo"
              required
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="mb-4 text-sm font-medium text-gray-900">Cambiar Contraseña</h3>
          <p className="mb-4 text-xs text-gray-500">
            Deja estos campos vacíos si no deseas cambiar tu contraseña
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nueva contraseña
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-10 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirmar nueva contraseña
              </label>
              <div className="relative mt-1">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-10 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Repite la nueva contraseña"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
