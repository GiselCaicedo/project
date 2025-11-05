'use client';

import type { ClientServiceSummary } from '@app/modules/client/services/types';
import PageHeader from '@shared/components/common/PageHeader';
import { Plus, Search } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import ServicesClientWidget from './ServicesClientWidget';

type SortOption = 'precio-desc' | 'precio-asc' | 'vencimiento' | 'alfabetico';

export default function MainServicesClient({ services, errorMessage }: { services: ClientServiceSummary[]; errorMessage: string | null }) {
  const router = useRouter();
  const params = useParams<{ locale?: string }>();
  const locale = typeof params?.locale === 'string' ? params.locale : 'es';

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('precio-desc');
  const [status, setStatus] = useState<'todos' | 'activo' | 'pendiente' | 'inactivo'>('todos');

  const breadcrumbs = [
    { label: 'Panel Cliente', href: `/${locale}/client/my_services` },
    { label: 'Mis Servicios' },
  ];

  const normalizeStatus = (value?: string | null): 'active' | 'inactive' | 'pending' => {
    const v = (value ?? '').toString().trim().toLowerCase();
    if (['active', 'activo', 'ativo', 'actif'].includes(v) || v.includes('activ')) return 'active';
    if (['inactive', 'inactivo', 'inactif'].includes(v) || v.includes('inactiv')) return 'inactive';
    return 'pending';
  };

  const selectedStatusCanonical = (sel: 'todos' | 'activo' | 'pendiente' | 'inactivo') =>
    sel === 'activo' ? 'active' : sel === 'inactivo' ? 'inactive' : sel === 'pendiente' ? 'pending' : 'all';

  const filteredAndSortedServices = useMemo(() => {
    let filtered = services;

    // Búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        service =>
          service.name.toLowerCase().includes(term)
          || service.category?.name?.toLowerCase().includes(term)
          || service.description?.toLowerCase().includes(term),
      );
    }

    // Filtro por estado (normalizado)
    const selected = selectedStatusCanonical(status);
    if (selected !== 'all') {
      filtered = filtered.filter(service => normalizeStatus(service.status) === selected);
    }

    // Ordenamiento
    const sorted = [...filtered];
    switch (sortBy) {
      case 'precio-desc':
        sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'precio-asc':
        sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'vencimiento':
        sorted.sort((a, b) => {
          const dateA = a.expiry ? new Date(a.expiry).getTime() : Number.POSITIVE_INFINITY;
          const dateB = b.expiry ? new Date(b.expiry).getTime() : Number.POSITIVE_INFINITY;
          return dateA - dateB;
        });
        break;
      case 'alfabetico':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return sorted;
  }, [services, searchTerm, sortBy, status]);

  const handleRequestService = () => {
    router.push(`/${locale}/client/my_services/requests`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Mis Servicios"
        description="Gestiona y administra tus servicios contratados con facilidad."
        actions={(
          <button
            type="button"
            onClick={handleRequestService}
            className="inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" />
            Solicitar servicio
          </button>
        )}
      />

      {errorMessage && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar servicios..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-4 pl-10 text-sm text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Estado:</label>
            <select
              id="status-filter"
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="todos">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">Ordenar por:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
            >
              <option value="precio-desc">Mayor precio</option>
              <option value="precio-asc">Menor precio</option>
              <option value="vencimiento">Vencimiento</option>
              <option value="alfabetico">Alfabético</option>
            </select>
          </div>
        </div>
      </div>

      <ServicesClientWidget services={filteredAndSortedServices} />
    </div>
  );
}

