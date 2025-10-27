'use client';

import { useEffect, useState } from 'react';
import { Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { useAlerts } from '@shared/components/common/AlertsProvider';

type ServiceExpiration = {
  id: string;
  serviceName: string;
  expirationDate: string;
  daysRemaining: number;
  status: 'expired' | 'warning' | 'ok';
};

export default function ServiceExpirationCard() {
  const { notify } = useAlerts();
  const [services, setServices] = useState<ServiceExpiration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServiceExpirations = async () => {
      try {
        setLoading(true);

        // TODO: Reemplazar con la llamada real al API cuando esté disponible
        // const response = await fetch('/api/client/services/expirations');
        // const data = await response.json();

        // Mock data por ahora
        const mockData: ServiceExpiration[] = [
          {
            id: '1',
            serviceName: 'Hosting Web',
            expirationDate: '2025-11-15',
            daysRemaining: 22,
            status: 'warning',
          },
          {
            id: '2',
            serviceName: 'Dominio principal',
            expirationDate: '2025-12-01',
            daysRemaining: 38,
            status: 'ok',
          },
          {
            id: '3',
            serviceName: 'Certificado SSL',
            expirationDate: '2025-10-20',
            daysRemaining: -4,
            status: 'expired',
          },
        ];

        // Ordenar por días restantes (vencidos primero, luego más próximos)
        const sorted = mockData.sort((a, b) => a.daysRemaining - b.daysRemaining);
        setServices(sorted);
      } catch (error: any) {
        notify({
          type: 'error',
          title: 'Error',
          description: error?.message || 'No se pudieron cargar los vencimientos',
        });
      } finally {
        setLoading(false);
      }
    };

    loadServiceExpirations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusColor = (status: ServiceExpiration['status']) => {
    switch (status) {
      case 'expired':
        return 'border';
      case 'warning':
        return ' border';
      case 'ok':
        return ' border';
      default:
        return ' border';
    }
  };

  const getStatusIcon = (status: ServiceExpiration['status']) => {
    switch (status) {
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      case 'ok':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysRemainingText = (days: number) => {
    if (days < 0) {
      return `Vencido hace ${Math.abs(days)} días`;
    }
    if (days === 0) {
      return 'Vence hoy';
    }
    if (days === 1) {
      return 'Vence mañana';
    }
    return `${days} días restantes`;
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white p-2">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Vencimientos de Servicios</h2>
            <p className="text-sm text-gray-600">Próximos vencimientos de tus servicios</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Cargando vencimientos...
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
            <p className="mt-2 text-gray-600">No hay servicios próximos a vencer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.slice(0, 5).map((service) => (
              <div
                key={service.id}
                className={`flex items-center justify-between rounded-lg border p-4 transition-all ${getStatusColor(service.status)}`}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <p className="font-medium text-gray-900">{service.serviceName}</p>
                    <p className="text-sm text-gray-600">
                      Vence: {formatDate(service.expirationDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    service.status === 'expired' ? 'text-red-700' :
                    service.status === 'warning' ? 'text-amber-700' :
                    'text-green-700'
                  }`}>
                    {getDaysRemainingText(service.daysRemaining)}
                  </p>
                </div>
              </div>
            ))}

            {services.length > 5 && (
              <button className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Ver todos ({services.length} servicios)
              </button>
            )}
          </div>
        )}
      </div>

      {!loading && services.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {services.filter(s => s.status === 'expired').length > 0 && (
                <span className="font-medium text-red-600">
                  {services.filter(s => s.status === 'expired').length} vencido(s)
                </span>
              )}
              {services.filter(s => s.status === 'warning').length > 0 && (
                <span className="ml-3 font-medium text-amber-600">
                  {services.filter(s => s.status === 'warning').length} próximo(s)
                </span>
              )}
            </span>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Renovar servicios
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
