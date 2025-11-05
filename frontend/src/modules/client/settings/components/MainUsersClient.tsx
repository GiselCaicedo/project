'use client';

import PageHeader from '@shared/components/common/PageHeader';
import ClientSettingsTabs from '@shared/components/settings/ClientSettingsTabs';
import ClientUsersPanel from '@shared/components/settings/ClientUsersPanel';

type Props = {
  locale: string;
};

export default function MainUsersClient({ locale }: Props) {
  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Configuración', href: `/${locale}/client/settings` },
    { label: 'Cliente' },
  ];

  return (
    <div className="space-y-6 px-4 py-10 sm:px-6 lg:px-12">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Cliente"
        description="Gestiona usuarios del cliente"
      />
      <ClientSettingsTabs />
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <ClientUsersPanel />
      </div>
    </div>
  );
}
