'use client';

import PageHeader from '@shared/components/common/PageHeader';
import ServiceExpirationCard from '@app/modules/client/dashboard/components/ServiceExpirationCard';
import { formatDate } from '@shared/utils/formatters';

type ClientDashboardSummary = {
  message: string;
  fetchedAt: string;
  notices: Array<{
    id: string;
    title: string;
    description: string;
  }>;
};

type Props = {
  summary: ClientDashboardSummary | null;
  errorMessage: string | null;
  locale: string;
};

export default function ClientDashboardContent({ summary, errorMessage, locale }: Props) {
  return (
    <div className="px-6 py-10 lg:px-8">
      <PageHeader
        title="Panel de Control"
        description="Resumen de la actividad reciente y el estado de su cuenta."
      />
    

      <div className="mb-8">
        <ServiceExpirationCard />
      </div>


      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
