'use client';

import { useEffect, useState } from 'react';
import { Save, Building2 } from 'lucide-react';
import { getCompanyProfileApi, saveCompanyProfileApi, type CompanyProfile } from '@shared/services/settings';
import { useAlerts } from '@shared/components/common/AlertsProvider';

export default function CompanyDataPanel() {
  const { notify } = useAlerts();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    status: true,
  });

  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        setLoading(true);

        // Obtener el clientId del token o context
        const token = typeof window !== 'undefined'
          ? window.sessionStorage.getItem('auth_token') || window.localStorage.getItem('auth_token')
          : null;

        if (!token) {
          throw new Error('No se encontró sesión activa');
        }

        // Decodificar el token para obtener el clientId
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentClientId = payload.clientId || payload.client_id || payload.businessId;

        if (!currentClientId) {
          throw new Error('No se pudo identificar la empresa');
        }

        setClientId(currentClientId);

        const profile = await getCompanyProfileApi(currentClientId);

        if (profile) {
          setFormData({
            name: profile.name || '',
            status: profile.status ?? true,
          });
        }
      } catch (error: any) {
        notify({
          type: 'error',
          title: 'Error',
          description: error?.message || 'No se pudo cargar los datos de la empresa',
        });
      } finally {
        setLoading(false);
      }
    };

    loadCompanyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      notify({
        type: 'error',
        title: 'Error',
        description: 'No se pudo identificar la empresa',
      });
      return;
    }

    if (!formData.name.trim()) {
      notify({
        type: 'warning',
        title: 'Datos incompletos',
        description: 'El nombre de la empresa es requerido',
      });
      return;
    }

    try {
      setSaving(true);

      await saveCompanyProfileApi(clientId, {
        name: formData.name,
        status: formData.status,
      });

      notify({
        type: 'success',
        title: 'Datos actualizados',
        description: 'Los datos de la empresa han sido actualizados correctamente',
      });
    } catch (error: any) {
      notify({
        type: 'error',
        title: 'Error',
        description: error?.message || 'No se pudo actualizar los datos de la empresa',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        Cargando datos de la empresa...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Datos de la Empresa</h2>
        <p className="mt-1 text-sm text-gray-600">
          Información general de tu empresa
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Información de la Empresa</h3>
              <p className="text-sm text-gray-600">
                Actualiza los datos básicos de tu empresa
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre de la Empresa
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Ej: Mi Empresa S.A."
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="company-status"
                type="checkbox"
                checked={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
              />
              <label htmlFor="company-status" className="text-sm text-gray-700 select-none">
                Empresa activa
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Los cambios en los datos de la empresa pueden afectar la visualización
            de información en facturas, cotizaciones y otros documentos.
          </p>
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
