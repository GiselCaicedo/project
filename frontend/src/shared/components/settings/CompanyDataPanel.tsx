'use client';

import { useAlerts } from '@shared/components/common/AlertsProvider';
import { getCompanyProfileApi, saveCompanyProfileApi } from '@shared/services/settings';
import { Building2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function CompanyDataPanel() {
  const { notify } = useAlerts();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    tax_id: '',
    phone: '',
    mobile: '',
    email: '',
    website: '',
    address: '',
    city: '',
    status: true,
    admin_contact: { name: '', role: '', phone: '', mobile: '', email: '' },
    accounting_contact: { name: '', role: '', phone: '', mobile: '', email: '' },
  });

  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        setLoading(true);
        const profile = await getCompanyProfileApi(null);
        if (profile) {
          setFormData(current => ({
            ...current,
            name: profile.name || '',
            legal_name: (profile as any).legal_name || '',
            tax_id: (profile as any).tax_id || '',
            phone: (profile as any).phone || '',
            mobile: (profile as any).mobile || '',
            email: (profile as any).email || '',
            website: (profile as any).website || '',
            address: (profile as any).address || '',
            city: (profile as any).city || '',
            status: profile.status ?? true,
            admin_contact: {
              name: (profile as any).admin_contact?.name || '',
              role: (profile as any).admin_contact?.role || '',
              phone: (profile as any).admin_contact?.phone || '',
              mobile: (profile as any).admin_contact?.mobile || '',
              email: (profile as any).admin_contact?.email || '',
            },
            accounting_contact: {
              name: (profile as any).accounting_contact?.name || '',
              role: (profile as any).accounting_contact?.role || '',
              phone: (profile as any).accounting_contact?.phone || '',
              mobile: (profile as any).accounting_contact?.mobile || '',
              email: (profile as any).accounting_contact?.email || '',
            },
          }));
        }
      } catch (error: any) {
        notify({
          type: 'error',
          title: 'Error',
          description: error?.message || 'No se pudo cargar los datos del cliente',
        });
      } finally {
        setLoading(false);
      }
    };
    void loadCompanyData();
  }, [notify]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      notify({
        type: 'warning',
        title: 'Datos incompletos',
        description: 'El nombre del cliente es requerido',
      });
      return;
    }
    try {
      setSaving(true);
      await saveCompanyProfileApi(clientId, formData as any);
      notify({
        type: 'success',
        title: 'Datos actualizados',
        description: 'Los datos del cliente han sido actualizados correctamente',
      });
    } catch (error: any) {
      notify({
        type: 'error',
        title: 'Error',
        description: error?.message || 'No se pudo actualizar los datos del cliente',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">Cargando datos del cliente...</div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Datos del cliente</h3>
              <p className="text-sm text-gray-600">Actualiza los datos básicos de tu empresa</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-gray-700">
              <span className="mb-1 block font-medium">Nombre</span>
              <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Mi Empresa" />
            </label>
            <label className="text-sm text-gray-700">
              <span className="mb-1 block font-medium">Razón social</span>
              <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={formData.legal_name} onChange={e => setFormData({ ...formData, legal_name: e.target.value })} placeholder="Mi Empresa S.A.S" />
            </label>
            <label className="text-sm text-gray-700">
              <span className="mb-1 block font-medium">NIT/CC</span>
              <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={formData.tax_id} onChange={e => setFormData({ ...formData, tax_id: e.target.value })} placeholder="900123456-7" />
            </label>
            <div className="flex items-center gap-3 pt-6">
              <input id="company-status" type="checkbox" checked={formData.status} onChange={e => setFormData({ ...formData, status: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200" />
              <label htmlFor="company-status" className="text-sm text-gray-700 select-none">Cliente activo</label>
            </div>
            <label className="text-sm text-gray-700">
              <span className="mb-1 block font-medium">Teléfono</span>
              <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="(1) 2345678" />
            </label>
            <label className="text-sm text-gray-700">
              <span className="mb-1 block font-medium">Celular</span>
              <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} placeholder="3001234567" />
            </label>
            <label className="text-sm text-gray-700">
              <span className="mb-1 block font-medium">Email</span>
              <input type="email" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="contacto@empresa.com" />
            </label>
            <label className="text-sm text-gray-700">
              <span className="mb-1 block font-medium">Página web</span>
              <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="https://empresa.com" />
            </label>
            <label className="text-sm text-gray-700 md:col-span-2">
              <span className="mb-1 block font-medium">Dirección</span>
              <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Calle 123 #45-67" />
            </label>
            <label className="text-sm text-gray-700 md:col-span-2">
              <span className="mb-1 block font-medium">Ciudad</span>
              <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="Bogotá" />
            </label>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 p-6">
            <h4 className="mb-4 text-sm font-semibold text-gray-900">Contacto administrativo</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-gray-700 md:col-span-2">
                <span className="mb-1 block font-medium">Nombre</span>
                <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={formData.admin_contact.name} onChange={e => setFormData({ ...formData, admin_contact: { ...formData.admin_contact, name: e.target.value } })} />
              </label>
              <label className="text-sm text-gray-700">
                <span className="mb-1 block font-medium">Cargo</span>
                <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={formData.admin_contact.role} onChange={e => setFormData({ ...formData, admin_contact: { ...formData.admin_contact, role: e.target.value } })} />
              </label>
              <label className="text-sm text-gray-700">
                <span className="mb-1 block font-medium">Teléfono</span>
                <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={formData.admin_contact.phone} onChange={e => setFormData({ ...formData, admin_contact: { ...formData.admin_contact, phone: e.target.value } })} />
              </label>
              <label className="text-sm text-gray-700">
                <span className="mb-1 block font-medium">Celular</span>
                <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={formData.admin_contact.mobile} onChange={e => setFormData({ ...formData, admin_contact: { ...formData.admin_contact, mobile: e.target.value } })} />
              </label>
              <label className="text-sm text-gray-700 md:col-span-2">
                <span className="mb-1 block font-medium">Email</span>
                <input type="email" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={formData.admin_contact.email} onChange={e => setFormData({ ...formData, admin_contact: { ...formData.admin_contact, email: e.target.value } })} />
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-6">
            <h4 className="mb-4 text-sm font-semibold text-gray-900">Cargo contable</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm text-gray-700 md:col-span-2">
                <span className="mb-1 block font-medium">Nombre</span>
                <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={formData.accounting_contact.name} onChange={e => setFormData({ ...formData, accounting_contact: { ...formData.accounting_contact, name: e.target.value } })} />
              </label>
              <label className="text-sm text-gray-700">
                <span className="mb-1 block font-medium">Cargo</span>
                <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={formData.accounting_contact.role} onChange={e => setFormData({ ...formData, accounting_contact: { ...formData.accounting_contact, role: e.target.value } })} />
              </label>
              <label className="text-sm text-gray-700">
                <span className="mb-1 block font-medium">Teléfono</span>
                <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={formData.accounting_contact.phone} onChange={e => setFormData({ ...formData, accounting_contact: { ...formData.accounting_contact, phone: e.target.value } })} />
              </label>
              <label className="text-sm text-gray-700">
                <span className="mb-1 block font-medium">Celular</span>
                <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={formData.accounting_contact.mobile} onChange={e => setFormData({ ...formData, accounting_contact: { ...formData.accounting_contact, mobile: e.target.value } })} />
              </label>
              <label className="text-sm text-gray-700 md:col-span-2">
                <span className="mb-1 block font-medium">Email</span>
                <input type="email" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" value={formData.accounting_contact.email} onChange={e => setFormData({ ...formData, accounting_contact: { ...formData.accounting_contact, email: e.target.value } })} />
              </label>
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
