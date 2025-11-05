import MainDashboard from '@app/modules/client/dashboard/components/MainDashboard';
import { getTranslations } from 'next-intl/server';

export default async function ClientDashboard(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  // Ensure namespace is loaded for client UI messages, even if not used directly here
  await getTranslations({ locale, namespace: 'Client.Dashboard' });

  return (
    <div className="space-y-6 p-6">
      <MainDashboard />
    </div>
  );
}
