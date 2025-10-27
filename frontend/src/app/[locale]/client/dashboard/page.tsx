import ClientDashboardContent from '@app/modules/client/dashboard/components/ClientDashboardContent';
import { getClientDashboardSummary } from '@app/panels/client/data/dashboard';
import { getTranslations } from 'next-intl/server';

export default async function ClientDashboard(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Client.Dashboard' });

  let summary: Awaited<ReturnType<typeof getClientDashboardSummary>> | null = null;
  let errorMessage: string | null = null;

  try {
    summary = await getClientDashboardSummary(locale);
  } catch (error) {
    console.error('Failed to load client dashboard summary', error);
    errorMessage = t('status.error');
  }

  return (
    <ClientDashboardContent
      summary={summary}
      errorMessage={errorMessage}
      locale={locale}
    />
  );
}
