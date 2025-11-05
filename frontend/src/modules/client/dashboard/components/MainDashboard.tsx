'use client';

import type { ClientDashboardData } from '../types';
import { SectionCard } from '@admin/dashboard/components/SectionCard';
import PageHeader from '@shared/components/common/PageHeader';
import { ExpirationsCard } from '@shared/components/dashboard/ExpirationsCard';
import { getClientDashboardApi } from '@shared/services/conexion';
import { useParams, useRouter } from 'next/navigation';

import React, { useEffect, useState } from 'react';
import { ServiceConsumptionCard } from './ServiceConsumptionCard';

export default function MainDashboard() {
  const [dashboardData, setDashboardData] = useState<ClientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { locale: routeLocale } = useParams() as { locale?: string };
  const locale = (routeLocale as string) || 'es-CO';
  const router = useRouter();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const data = await getClientDashboardApi();
        setDashboardData(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar el dashboard');
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const toggleRequest = () => {
    router.push(`/${locale}/client/dashboard/recharge`);
  };

  const actionButtons = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={toggleRequest}
        className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600"
      >
        Recargar Saldo
      </button>
    </div>
  );

  if (loading) {
    return (
      <div>
        <PageHeader
          breadcrumbs={[
            { label: 'Inicio', href: `/${locale}/client/inicio` },
            { label: 'Panel de Cliente' },
          ]}
          title="Panel de Cliente"
          description="Resumen de la actividad reciente y el estado de su cuenta."
          actions={actionButtons}
        />

      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <>
        <PageHeader
          breadcrumbs={[
            { label: 'Inicio', href: `/${locale}/client/inicio` },
            { label: 'Panel de Cliente' },
          ]}
          title="Panel de Cliente"
          description="Resumen de la actividad reciente y el estado de su cuenta."
          actions={actionButtons}
        />
      </>
    );
  }

  // Separar vencimientos por tipo
  const invoiceExpirations = dashboardData.expirations.filter(exp => exp.type === 'invoice');
  const serviceExpirations = dashboardData.expirations.filter(exp => exp.type === 'service');

  return (
    <div className="space-y-6">

      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', href: `/${locale}/client/inicio` },
          { label: 'Panel de Cliente' },
        ]}
        title="Panel de Cliente"
        description="Resumen de la actividad reciente y el estado de su cuenta."
        actions={actionButtons}
      />

      <ServiceConsumptionCard services={dashboardData.serviceConsumption} locale={locale} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Facturas por Vencer"
          description="Próximas facturas a vencer"
        >
          <ExpirationsCard
            locale={locale}
            items={invoiceExpirations}
            labels={{
              empty: 'No hay facturas próximas a vencer',
              dueToday: 'Vence hoy',
              dueTomorrow: 'Vence mañana',
              dueIn: days => `Vence en ${days} días`,
            }}
            maxItems={5}
          />
        </SectionCard>

        <SectionCard
          title="Servicios por Vencer"
          description="Servicios próximos a vencer"
        >
          <ExpirationsCard
            locale={locale}
            items={serviceExpirations}
            labels={{
              empty: 'No hay servicios próximos a vencer',
              dueToday: 'Vence hoy',
              dueTomorrow: 'Vence mañana',
              dueIn: days => `Vence en ${days} días`,
            }}
            maxItems={5}
          />
        </SectionCard>
      </div>
    </div>
  );
}
