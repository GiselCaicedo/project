'use client';

import type { TaxRecord } from '@admin/settings/taxes/types';
import type {
  PersistServiceInput,
  ServiceCategory,
  ServiceRecord,
  ServiceStatus,
} from './types';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import ConfirmDialog from '@shared/components/common/ConfirmDialog';
import PageHeader from '@shared/components/common/PageHeader';
import SidePanel from '@shared/components/common/SidePanel';
import {
  createAdminServiceApi,
  deleteAdminServiceApi,
  updateAdminServiceApi,
} from '@shared/services/conexion';
import { Plus, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import ServiceCardList from './ServiceCardList';
import ServiceExpandedView from './ServiceExpandedView';
import ServiceFormPanel from './ServiceFormPanel';

type Props = {
  initialServices: ServiceRecord[];
  initialCategories: ServiceCategory[];
  initialTaxes: TaxRecord[];
  initialError?: string | null;
};

type EditState = {
  viewServiceId: string | null;
  editServiceId: string | null;
  isCreating: boolean;
};

export default function ServiceListView({
  initialServices,
  initialCategories,
  initialTaxes,
  initialError = null,
}: Props) {
  const { locale } = useParams() as { locale: string };
  const listT = useTranslations('Servicios.List');
  const formT = useTranslations('Servicios.Form');
  const alertsT = useTranslations('Servicios.Alerts');
  const confirmT = useTranslations('Servicios.ConfirmDelete');
  const { notify } = useAlerts();
  const router = useRouter();

  const [services, setServices] = useState<ServiceRecord[]>(() =>
    initialServices.map(service => ({ ...service })),
  );
  const [categories] = useState<ServiceCategory[]>(() =>
    initialCategories.map(category => ({ ...category })),
  );
  const [taxes] = useState<TaxRecord[]>(() =>
    initialTaxes.map(tax => ({ ...tax })),
  );

  const [quickFilter, setQuickFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] =
    useState<ServiceStatus | 'all'>('all');
  const [onlyWithClients, setOnlyWithClients] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(initialError);
  const [editState, setEditState] = useState<EditState>({
    viewServiceId: null,
    editServiceId: null,
    isCreating: false,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServiceRecord | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const filteredServices = useMemo(() => {
    const searchTerm = quickFilter.toLowerCase().trim();
    return services.filter(service => {
      const matchesText =
        !searchTerm ||
        service.name.toLowerCase().includes(searchTerm) ||
        service.description?.toLowerCase().includes(searchTerm) ||
        service.category?.name.toLowerCase().includes(searchTerm);

      const matchesCategory =
        selectedCategory === 'all' || service.category?.id === selectedCategory;

      const matchesStatus =
        selectedStatus === 'all' || service.status === selectedStatus;

      const matchesClients =
        !onlyWithClients || (service.clientsCount ?? 0) > 0;

      return (
        matchesText &&
        matchesCategory &&
        matchesStatus &&
        matchesClients
      );
    });
  }, [services, quickFilter, selectedCategory, selectedStatus, onlyWithClients]);

  const breadcrumbs = useMemo(
    () => [
      { label: listT('breadcrumbs.home'), href: `/${locale}/admin/dashboard` },
      { label: listT('breadcrumbs.section') },
    ],
    [listT, locale],
  );

  const toggleCreateForm = () => {
    setEditState(prev => ({
      viewServiceId: null,
      editServiceId: null,
      isCreating: !prev.isCreating,
    }));
    setSaving(false);
    setDeleting(false);
  };

  const toggleRequest = () => {
    router.push(`/${locale}/admin/services/requests`);
  };

  const toggleViewService = (serviceId: string) => {
    setEditState(prev => ({
      viewServiceId: prev.viewServiceId === serviceId ? null : serviceId,
      editServiceId: null,
      isCreating: false,
    }));
    setSaving(false);
    setDeleting(false);
  };

  const openEditForm = (serviceId: string) => {
    setEditState({
      viewServiceId: null,
      editServiceId: serviceId,
      isCreating: false,
    });
    setSaving(false);
    setDeleting(false);
  };

  const closeAllForms = () => {
    setEditState({
      viewServiceId: null,
      editServiceId: null,
      isCreating: false,
    });
    setSaving(false);
    setDeleting(false);
  };

  const handleCreate = async (payload: PersistServiceInput) => {
    try {
      setSaving(true);
      const created = await createAdminServiceApi(payload);
      setServices(current => [...current, { ...created }]);
      setErrorMessage(null);
      notify({
        type: 'success',
        title: alertsT('created.title'),
        description: alertsT('created.description'),
      });
      closeAllForms();
    } catch (error: any) {
      console.error('create service error', error);
      const message = error?.message ?? alertsT('saveError.description');
      setErrorMessage(message);
      notify({
        type: 'error',
        title: alertsT('saveError.title'),
        description: message,
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (
    serviceId: string,
    payload: PersistServiceInput,
  ) => {
    try {
      setSaving(true);
      const updated = await updateAdminServiceApi(serviceId, payload);
      setServices(current =>
        current.map(service =>
          service.id === updated.id ? { ...updated } : service,
        ),
      );
      setErrorMessage(null);
      notify({
        type: 'success',
        title: alertsT('updated.title'),
        description: alertsT('updated.description'),
      });
      closeAllForms();
    } catch (error: any) {
      console.error('update service error', error);
      const message = error?.message ?? alertsT('saveError.description');
      setErrorMessage(message);
      notify({
        type: 'error',
        title: alertsT('saveError.title'),
        description: message,
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteAdminServiceApi(deleteTarget.id);
      setServices(current =>
        current.filter(service => service.id !== deleteTarget.id),
      );
      notify({
        type: 'success',
        title: alertsT('deleted.title'),
        description: alertsT('deleted.description'),
      });
      setConfirmDelete(false);
      setDeleteTarget(null);
      closeAllForms();
    } catch (error: any) {
      console.error('delete service error', error);
      const statusMessage = error?.response?.data?.message ?? error?.message;
      const message = statusMessage ?? alertsT('deleteError.description');
      setErrorMessage(message);

      const isAssigned =
        typeof statusMessage === 'string' &&
        statusMessage.toLowerCase().includes('asignado');

      notify({
        type: 'error',
        title: isAssigned
          ? alertsT('assignedError.title')
          : alertsT('deleteError.title'),
        description: isAssigned
          ? alertsT('assignedError.description')
          : message,
      });
    } finally {
      setDeleting(false);
    }
  };

  const actionButtons = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggleCreateForm}
        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
      >
        <Plus className="h-4 w-4" />
        {listT('createButton')}
      </button>

      <button
        type="button"
        onClick={toggleRequest}
        className="inline-flex items-center gap-2 rounded-lg border border-primary-300 bg-primary-100 px-4 py-2 text-sm text-primary-500 transition hover:bg-primary-200"
      >
        Ver Solicitudes Clientes
      </button>
    </div>
  );

  return (
    <div className="space-y-6" ref={contentRef}>
      <PageHeader
        breadcrumbs={breadcrumbs}
        title={listT('title')}
        description={listT('description')}
        actions={actionButtons}
      />

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={quickFilter}
              onChange={event => setQuickFilter(event.target.value)}
              placeholder={listT('searchPlaceholder')}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
            />
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
              >
                <option value="all">Todas las categorí­as</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus as string}
                onChange={e =>
                  setSelectedStatus(e.target.value as ServiceStatus | 'all')
                }
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={onlyWithClients}
                  onChange={e => setOnlyWithClients(e.target.checked)}
                  className="h-4 w-10 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Solo con clientes
              </label>

              <button
                onClick={() => {
                  setQuickFilter('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                  setOnlyWithClients(false);
                }}
                className="flex justify-end sm:ml-auto rounded-md border border-gray-200 px-10 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
          {errorMessage && (
            <span className="text-sm font-medium text-red-600">
              {errorMessage}
            </span>
          )}
        </div>

        <div className="mt-4 space-y-4">
          <ServiceCardList
            services={filteredServices}
            expandedServiceId={editState.viewServiceId}
            onToggleExpand={toggleViewService}
            onEdit={openEditForm}
            onDelete={service => {
              setDeleteTarget(service);
              setConfirmDelete(true);
            }}
            renderExpandedContent={service => (
              <ServiceExpandedView service={service} />
            )}
          />
        </div>
      </div>

      {/* SidePanel para ediciÃ³n */}
      <SidePanel
        title={formT('editTitle')}
        open={!!editState.editServiceId}
        onClose={closeAllForms}
        width={480}
        >
        {editState.editServiceId && (
          <ServiceFormPanel
            mode="edit"
            service={
              services.find(s => s.id === editState.editServiceId) ?? null
            }
            categories={categories}
            taxes={taxes}
            open={true}
            onSubmit={payload => handleUpdate(editState.editServiceId!, payload)}
            onCancel={closeAllForms}
            onDelete={() => {
              const service = services.find(
                s => s.id === editState.editServiceId,
              );
              if (service) {
                setDeleteTarget(service);
                setConfirmDelete(true);
              }
            }}
            saving={saving}
            deleting={deleting}
          />
        )}
      </SidePanel>

      {/* SidePanel para creaciÃ³n */}
      <SidePanel
        title={formT('createTitle')}
        open={editState.isCreating}
        onClose={closeAllForms}
        width={480}
        >
        <ServiceFormPanel
          mode="create"
          service={null}
          categories={categories}
          taxes={taxes}
          open={editState.isCreating}
          onSubmit={handleCreate}
          onCancel={closeAllForms}
          saving={saving}
          deleting={deleting}
        />
      </SidePanel>

      <ConfirmDialog
        open={confirmDelete}
        onCancel={() => {
          setConfirmDelete(false);
          setDeleting(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title={confirmT('title')}
        description={confirmT('description')}
        confirmLabel={confirmT('confirm')}
        cancelLabel={confirmT('cancel')}
        variant="danger"
      />
    </div>
  );
}


