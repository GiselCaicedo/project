'use client';

import type { ServiceRecord } from '@admin/services/types';
import type { CreateClientQuoteInput } from '@app/modules/client/quotes/types';
import ClientQuoteForm from '@app/modules/client/quotes/components/ClientQuoteForm';
import { useAlerts } from '@shared/components/common/AlertsProvider';
import PageHeader from '@shared/components/common/PageHeader';
import { getAdminServicesListApi, submitClientQuoteApi } from '@shared/services/conexion';
import { Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NewClientQuotePage() {
  const router = useRouter();
  const { locale } = useParams() as { locale: string };
  const { notify } = useAlerts();

  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const payload = await getAdminServicesListApi();
        setServices(payload.services ?? []);
      } catch (error) {
        console.error('Error loading services:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Error al cargar servicios');
      } finally {
        setLoading(false);
      }
    };

    void loadServices();
  }, []);

  const handleSubmit = async (payload: CreateClientQuoteInput) => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await submitClientQuoteApi(payload);
      notify({ type: 'success', title: 'Cotización creada correctamente' });
      router.push(`/${locale}/client/quotes`);
    } catch (error) {
      console.error('Error creating quote:', error);
      const message = error instanceof Error ? error.message : 'No fue posible crear la cotización';
      setErrorMessage(message);
      notify({ type: 'error', title: 'Error al crear cotización', description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${locale}/client/quotes`);
  };

  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Cotizaciones', href: `/${locale}/client/quotes` },
    { label: 'Nueva cotización' },
  ];

  return (
    <div className="px-6 py-8 lg:px-8">
      <PageHeader breadcrumbs={breadcrumbs} title="Nueva cotización" description="Crea una nueva cotización para solicitar servicios." />

      <div className="mt-6">
        {loading
          ? (
              <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-12">
                <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary-500" />
                <span className="text-sm text-gray-600">Cargando servicios…</span>
              </div>
            )
          : (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <ClientQuoteForm
                  services={services}
                  loading={loading}
                  submitting={submitting}
                  errorMessage={errorMessage}
                  locale={locale}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                />
              </div>
            )}
      </div>
    </div>
  );
}
