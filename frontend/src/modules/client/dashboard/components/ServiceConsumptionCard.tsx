import type { ServiceConsumption } from '../types';
import { formatCurrency, formatDate } from '@shared/utils/formatters';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

type ServiceConsumptionCardProps = {
  services: ServiceConsumption[];
  locale: string;
};

export function ServiceConsumptionCard({ services, locale }: ServiceConsumptionCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!services || services.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">No hay saldos registrados en este momento.</p>
      </div>
    );
  }

  // Ordenar servicios por consumo (mayor a menor)
  const sortedServices = [...services].sort((a, b) => b.consumption - a.consumption);
  const totalConsumption = services.reduce((sum, service) => sum + service.consumption, 0);

  // Mostrar 3 servicios a la vez
  const servicesPerView = 3;
  const totalSlides = Math.ceil(sortedServices.length / servicesPerView);

  const nextSlide = () => {
    setCurrentIndex(prev => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentIndex(prev => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const visibleServices = sortedServices.slice(
    currentIndex * servicesPerView,
    (currentIndex + 1) * servicesPerView,
  );

  return (
    <div className="rounded-3xl bg-white">
      {/* Header */}
      <div className="my-5 flex items-center rounded-3xl border border-gray-200 px-6 py-4">
        <div>
        </div>
        <div className="flex w-full justify-between">
          <p className="text-xl font-semibold tracking-wide text-primary-500 uppercase">Saldo Total</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalConsumption, locale)}
          </p>
        </div>
      </div>

      {/* Carrusel de servicios */}
      <div className="relative mb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {visibleServices.map((service, idx) => {
            const percentage = totalConsumption > 0 ? (service.consumption / totalConsumption) * 100 : 0;
            const globalIndex = currentIndex * servicesPerView + idx;

            return (
              <div
                key={service.serviceId}
                className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow"
              >
                {/* Header con número y porcentaje */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
                      <span className="text-sm font-semibold text-gray-700">
                        #
                        {globalIndex + 1}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-gray-500">
                      {percentage.toFixed(1)}
                      %
                    </div>
                  </div>
                </div>

                {/* Nombre del servicio */}
                <div className="mb-4">
                  <h4 className="mb-2 line-clamp-2 text-base font-semibold text-gray-900">
                    {service.serviceName}
                  </h4>
                  {service.lastUsage && (
                    <p className="text-xs text-gray-500">
                      Último uso:
                      {' '}
                      {formatDate(service.lastUsage, locale)}
                    </p>
                  )}
                </div>

                {/* Monto */}
                <div className="mb-3">
                  <p className="mb-1 text-sm text-gray-500">Consumo</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(service.consumption, locale)}
                  </p>
                </div>

                {/* Barra de progreso */}
                <div className="relative h-2 overflow-hidden rounded-full bg-primary-100">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary-600 transition-all duration-700"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Botones de navegación */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className="absolute top-1/2 left-0 flex h-10 w-10 -translate-x-4 -translate-y-1/2 items-center justify-center rounded-full border border-gray-300 bg-white shadow-md transition-all hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={nextSlide}
              disabled={currentIndex === totalSlides - 1}
              className="absolute top-1/2 right-0 flex h-10 w-10 translate-x-4 -translate-y-1/2 items-center justify-center rounded-full border border-gray-300 bg-white shadow-md transition-all hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {/* Indicadores de página */}
      {totalSlides > 1 && (
        <div className="flex items-center justify-center gap-3">
          <div className="flex gap-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-primary-900'
                    : 'w-1.5 bg-primary-300 hover:bg-primary-400'
                }`}
                aria-label={`Ir a página ${index + 1}`}
              />
            ))}
          </div>
          <span className="ml-2 text-xs text-gray-500">
            {currentIndex + 1}
            {' '}
            /
            {totalSlides}
          </span>
        </div>
      )}
    </div>
  );
}
