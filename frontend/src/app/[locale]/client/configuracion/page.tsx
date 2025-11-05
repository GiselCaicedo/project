'use client';

import PageHeader from '@shared/components/common/PageHeader';
import ClientSettingsTabView from '@shared/components/settings/ClientSettingsTabView';
import { useParams } from 'next/navigation';

export default function ConfiguracionPage() {
  const params = useParams<{ locale?: string }>();
  const locale = typeof params?.locale === 'string' ? params.locale : 'es';
  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'ConfiguraciÃ³n' },
  ];

  return (
    <div className="px-6 py-8 lg:px-8">
      <PageHeader breadcrumbs={breadcrumbs} title="ConfiguraciÃ³n" description="Gestiona la configuraciÃ³n de tu cuenta y empresa" />

      <ClientSettingsTabView />
    </div>
  );
}
