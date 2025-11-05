'use client';

import PageHeader from '@shared/components/common/PageHeader';
import ClientSettingsTabs from '@shared/components/settings/ClientSettingsTabs';
import UserProfilePanel from '@shared/components/settings/UserProfilePanel';

type Props = {
  locale: string;
};

export default function MainProfileClient({ locale }: Props) {
  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Configuración', href: `/${locale}/client/settings` },
    { label: 'Usuario' },
  ];

  return (
    <div className="space-y-6 px-4 py-10 sm:px-6 lg:px-12">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Usuario"
        description="Configuración de perfil"
      />
      <ClientSettingsTabs />
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <UserProfilePanel />
      </div>
    </div>
  );
}
