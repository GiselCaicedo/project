'use client';

import type { ServiceRecord } from '@admin/services/types';
import PageHeader from '@shared/components/common/PageHeader';
import HeaderUserBar from '@shared/components/common/HeaderUserBar';
import { createClientServiceRequestApi } from '@shared/services/conexion';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ServiceRequestFormProps = {
  services: ServiceRecord[];
  errorMessage?: string | null;
  locale: string;
};

export default function ServiceRequestForm({
  services,
  errorMessage = null,
  locale,
}: ServiceRequestFormProps) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const breadcrumbs = [
    { label: 'Panel Cliente', href: `/${locale}/client/my_services` },
    { label: 'Mis Servicios', href: `/${locale}/client/my_services` },
    { label: 'Solicitar Servicio' },
  ];

  const handleCancel = () => {
    router.push(`/${locale}/client/my_services`);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError(null);

    if (!serviceId || serviceId.trim() === '') {
      setError('Por favor selecciona un servicio');
      return;
    }

    setSubmitting(true);

    try {
      await createClientServiceRequestApi(serviceId, description || null);
      router.push(`/${locale}/client/my_services/requests`);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'No fue posible solicitar el servicio';
      setError(message);
      setSubmitting(false);
    }
  };

  const selectedService = services.find(s => s.id === serviceId);

  return (
    <div>
      <HeaderUserBar locale={locale} variant="client" />
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Solicitar Nuevo Servicio"
        description="Completa el formulario para solicitar un nuevo servicio"
      />

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-700">{errorMessage}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      <div>
        <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-gray-200 bg-white p-6">

          <div className="space-y-2">
            <label htmlFor="service" className="block text-sm font-medium text-gray-700">
              Servicio
              {' '}
              <span className="text-rose-500">*</span>
            </label>
            <select
              id="service"
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
              disabled={submitting || services.length === 0}
              required
            >
              <option value="">Selecciona un servicio</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          {selectedService && (
            <div className="rounded-md border border-blue-100 p-4">

              <div className="space-y-1 text-sm text-blue-800">
                {selectedService.description && (
                  <p>
                    <span className="font-medium">Descripción:</span>
                    {' '}
                    {selectedService.description}
                  </p>
                )}
                {selectedService.price !== null && (
                  <p>
                    <span className="font-medium">Precio:</span>
                    {' '}
                    $
                    {selectedService.price.toFixed(2)}
                  </p>
                )}
                {selectedService.frequency && (
                  <p>
                    <span className="font-medium">Frecuencia:</span>
                    {' '}
                    {selectedService.frequency}
                  </p>
                )}
                {selectedService.category && (
                  <p>
                    <span className="font-medium">Categoría:</span>
                    {' '}
                    {selectedService.category.name}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Comentarios adicionales
            </label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Añade cualquier comentario o especificación para tu solicitud (opcional)"
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none"
              disabled={submitting}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || services.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando solicitud...
                    </>
                  )
                : (
                    'Solicitar servicio'
                  )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
