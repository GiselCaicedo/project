'use client';

import HeaderUserBar from '@shared/components/common/HeaderUserBar';
import PageHeader from '@shared/components/common/PageHeader';
import ClientSettingsTabView from '@shared/components/settings/ClientSettingsTabView';

type Props = {
  locale: string;
};

export default function MainConfigClient({ locale }: Props) {
  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Configuración' },
  ];

  return (
    <div className="space-y-6">
      <HeaderUserBar locale={locale} variant="client" />
      <PageHeader breadcrumbs={breadcrumbs} title="Configuración" description="Gestiona la configuración de tu cuenta y empresa" />
      <ClientSettingsTabView />
    </div>
  );
}
