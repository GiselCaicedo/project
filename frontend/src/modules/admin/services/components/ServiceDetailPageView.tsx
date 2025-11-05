'use client';

import type { TaxRecord } from '@admin/settings/taxes/types';
import type { ColDef } from 'ag-grid-community';
import type { PersistServiceInput, ServiceClientAssignment, ServiceDetail } from '../types';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import ConfirmDialog from '@shared/components/common/ConfirmDialog';
import PageHeader from '@shared/components/common/PageHeader';
import SidePanel from '@shared/components/common/SidePanel';
import AgTable from '@shared/components/datagrid/AgTable';
import {
  deleteAdminServiceApi,
  getAdminServiceDetailApi,
  getAdminTaxesApi,
  updateAdminServiceApi,
} from '@shared/services/conexion';
import { createDateFormatter } from '@shared/utils/columnFormatters';
import { formatCurrency } from '@shared/utils/formatters';
import { PencilLine, Trash2, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ServiceFormPanel from './ServiceFormPanel';

type ServiceDetailPageViewProps = {
  initialService: ServiceDetail;
  locale: string;
  serviceId: string;
};

export default function ServiceDetailPageView({ initialService, locale, serviceId }: ServiceDetailPageViewProps) {
  const router = useRouter();
  const [service, setService] = useState<ServiceDetail>(initialService);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [taxes, setTaxes] = useState<TaxRecord[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const { notify } = useAlerts();

  const t = useTranslations('Servicios.Detail');
  const formT = useTranslations('Servicios.Form');
  const alertsT = useTranslations('Servicios.Alerts');
  const confirmT = useTranslations('Servicios.ConfirmDelete');

  useEffect(() => {
    const loadTaxes = async () => {
      try {
        const taxesData = await getAdminTaxesApi();
        setTaxes(taxesData ?? []);
      } catch (error) {
        console.error('Failed to load taxes', error);
      }
    };
    loadTaxes();
  }, []);

  const refreshService = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const detail = await getAdminServiceDetailApi(serviceId);
      if (detail) {
        setService(detail);
      }
    } catch (error) {
      console.error('Failed to refresh service detail', error);
      const message = error instanceof Error ? error.message : 'No fue posible actualizar la informaciÃ³n.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [serviceId]);

  const breadcrumbs = useMemo(
    () => [
      { label: 'Panel de Cliente', href: `/${locale}/admin/dashboard` },
      { label: 'Servicios', href: `/${locale}/admin/services` },
      { label: service.name },
    ],
    [locale, service.name],
  );

  const handleUpdate = useCallback(
    async (payload: PersistServiceInput) => {
      setSavingEdit(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      try {
        const updated = await updateAdminServiceApi(serviceId, payload);
        setService(prev => ({ ...prev, ...updated }));
        setIsEditOpen(false);
        notify({ type: 'success', title: alertsT('updated.title'), description: alertsT('updated.description') });
        await refreshService();
      } catch (error) {
        console.error('Failed to update service', error);
        const message = error instanceof Error ? error.message : 'No fue posible actualizar el servicio.';
        setErrorMessage(message);
        notify({ type: 'error', title: alertsT('saveError.title'), description: message });
        throw error;
      } finally {
        setSavingEdit(false);
      }
    },
    [serviceId, refreshService, notify, alertsT],
  );

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    setErrorMessage(null);
    try {
      await deleteAdminServiceApi(serviceId);
      notify({ type: 'success', title: alertsT('deleted.title'), description: alertsT('deleted.description') });
      router.push(`/${locale}/admin/services`);
    } catch (error) {
      console.error('Failed to delete service', error);
      const statusMessage = error instanceof Error ? error.message : null;
      const message = statusMessage ?? alertsT('deleteError.description');
      setErrorMessage(message);
      const isAssigned = typeof statusMessage === 'string' && statusMessage.toLowerCase().includes('asignado');
      notify({
        type: 'error',
        title: isAssigned ? alertsT('assignedError.title') : alertsT('deleteError.title'),
        description: isAssigned ? alertsT('assignedError.description') : message,
      });
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }, [serviceId, locale, router, notify, alertsT]);

  const formatDate = (date: string | null | undefined): string => {
    if (!date) {
      return 'â€”';
    }
    try {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(date));
    } catch {
      return 'â€”';
    }
  };

  const formatTaxLabel = (tax: ServiceDetail['taxOne']) => {
    if (!tax) {
      return 'â€”';
    }
    return `${tax.name} (${tax.percentage.toFixed(2)}%)`;
  };

  const clientColumns = useMemo<ColDef<ServiceClientAssignment>[]>(() => {
    const dateFormatter = createDateFormatter(locale);

    return [
      {
        headerName: t('clientName'),
        field: 'clientName',
        flex: 1.5,
        minWidth: 200,
      },
      {
        headerName: t('started'),
        field: 'started',
        minWidth: 140,
        valueFormatter: dateFormatter,
        cellClass: 'text-center justify-center',
      },
      {
        headerName: t('delivery'),
        field: 'delivery',
        minWidth: 140,
        valueFormatter: dateFormatter,
        cellClass: 'text-center justify-center',
      },
      {
        headerName: t('expiry'),
        field: 'expiry',
        minWidth: 140,
        valueFormatter: dateFormatter,
        cellClass: 'text-center justify-center',
      },
      {
        headerName: t('frequency'),
        field: 'frequency',
        minWidth: 140,
        valueFormatter: params => params.value ?? 'â€”',
        cellClass: 'text-center justify-center',
      },
    ];
  }, [locale, t]);

  const statusBadge
    = service.status === 'active'
      ? (
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
            {t('statusActive')}
          </span>
        )
      : (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
            {t('statusInactive')}
          </span>
        );

  const actionButtons = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => setIsEditOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-primary-600 bg-white px-4 py-2 text-sm font-semibold text-primary-600 transition hover:bg-primary-50"
      >
        <PencilLine className="h-4 w-4" />
        {t('editButton')}
      </button>
      <button
        type="button"
        onClick={() => setConfirmDelete(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-red-600 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        {t('deleteButton')}
      </button>
    </div>
  );

  return (
    <div className="space-y-6" ref={containerRef}>
      <PageHeader breadcrumbs={breadcrumbs} title={service.name} description={service.description ?? undefined} actions={actionButtons} />

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>
      )}

      {/* InformaciÃ³n general del servicio */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">{t('generalInfo')}</h2>
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-3">
          {/* Columna 1: InformaciÃ³n bÃ¡sica */}
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('name')}</p>
              <p className="mt-1.5 text-sm font-semibold text-gray-900">{service.name}</p>
            </div>

            {service.description && (
              <div>
                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('description')}</p>
                <p className="mt-1.5 text-sm text-gray-700">{service.description}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('category')}</p>
              <p className="mt-1.5 text-sm font-semibold text-gray-900">
                {service.category?.name ?? t('uncategorized')}
              </p>
            </div>

            {service.unit && (
              <div>
                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('unit')}</p>
                <p className="mt-1.5 text-sm font-semibold text-gray-900">{service.unit}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('status')}</p>
              <div className="mt-1.5">{statusBadge}</div>
            </div>
          </div>

          {/* Columna 2: Precios e impuestos */}
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('price')}</p>
              <p className="mt-1.5 text-lg font-bold text-gray-900">
                {formatCurrency(service.price ?? 0, locale)}
              </p>
            </div>

            {service.subtotal != null && (
              <div>
                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('subtotal')}</p>
                <p className="mt-1.5 text-sm font-semibold text-gray-900">
                  {formatCurrency(service.subtotal, locale)}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('taxOne')}</p>
              <p className="mt-1.5 text-sm font-semibold text-gray-900">{formatTaxLabel(service.taxOne)}</p>
            </div>

            {service.taxTwo && (
              <div>
                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('taxTwo')}</p>
                <p className="mt-1.5 text-sm font-semibold text-gray-900">{formatTaxLabel(service.taxTwo)}</p>
              </div>
            )}
          </div>

          {/* Columna 3: Fechas y estadÃ­sticas */}
          <div className="space-y-5">
            {service.frequency && (
              <div>
                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('frequency')}</p>
                <p className="mt-1.5 text-sm font-semibold text-gray-900">{service.frequency}</p>
              </div>
            )}

            {(service.startDate || service.endDate) && (
              <div>
                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('dates')}</p>
                <p className="mt-1.5 text-sm font-semibold text-gray-900">
                  {formatDate(service.startDate)}
                  {' '}
                  â†’
                  {formatDate(service.endDate)}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('clients')}</p>
              <p className="mt-1.5 text-sm font-semibold text-gray-900">
                {service.clientsCount ?? 0}
                {' '}
                {t('clientsLabel')}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('createdAt')}</p>
              <p className="mt-1.5 text-sm text-gray-700">{formatDate(service.createdAt)}</p>
            </div>

            <div>
              <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{t('updatedAt')}</p>
              <p className="mt-1.5 text-sm text-gray-700">{formatDate(service.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Clientes asignados */}
      {service.clients && service.clients.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Users className="h-5 w-5" />
            {t('assignedClients')}
          </h2>
          <AgTable<ServiceClientAssignment>
            rows={service.clients}
            columns={clientColumns}
            getRowId={data => data.id}
            height={400}
          />
        </div>
      )}

      {/* SidePanel para ediciÃ³n */}
      <SidePanel
        title={formT('editTitle')}
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        width={480}
        >
        {isEditOpen && (
          <ServiceFormPanel
            mode="edit"
            service={service}
            categories={[service.category].filter((c): c is NonNullable<typeof c> => c !== null)}
            taxes={taxes}
            open={isEditOpen}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditOpen(false)}
            onDelete={() => {
              setIsEditOpen(false);
              setConfirmDelete(true);
            }}
            saving={savingEdit}
            deleting={false}
          />
        )}
      </SidePanel>

      <ConfirmDialog
        open={confirmDelete}
        onCancel={() => {
          setConfirmDelete(false);
          setDeleting(false);
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


