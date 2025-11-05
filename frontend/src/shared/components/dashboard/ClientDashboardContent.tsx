'use client';

import ServiceExpirationCard from './ServiceExpirationCard';

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Bienvenido a tu panel de cliente
        </p>
      </div>

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
