'use client';

import PageHeader from '@shared/components/common/PageHeader';
import { useTranslations } from 'next-intl';

export default function ProfileSettingsPage() {
  const t = useTranslations('Settings.Profile');

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={t('pageTitle')}
        description={t('pageDescription')}
        breadcrumbs={[{ label: t('breadcrumbs.section'), href: '/settings' }, { label: t('breadcrumbs.current') }]}
      />

      <div className="mx-auto mt-6 max-w-3xl">
        <div className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-center text-slate-500">
            <p>Esta página está en construcción.</p>
            <p className="mt-2 text-sm">Las funciones de perfil de usuario estarán disponibles próximamente.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
