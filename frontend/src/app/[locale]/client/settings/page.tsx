'use client';

import type { ElementType } from 'react';
import PageHeader from '@shared/components/common/PageHeader';
import { buildClientSettingsHref, CLIENT_SETTINGS_NAV, getClientSettingsBasePath } from '@shared/settings/clientNavigation';
import { Building2, Settings, UserCircle, Users } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';

const ICONS: Record<string, ElementType> = {
  users: Users,
  profile: UserCircle,
  company: Building2,
};

export default function ClientSettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = getClientSettingsBasePath(pathname ?? undefined);
  const params = useParams<{ locale?: string }>();
  const locale = typeof params?.locale === 'string' ? params.locale : 'es';
  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Configuración' },
  ];

  return (
    <div className="space-y-8 px-4 py-10 sm:px-6 lg:px-12">
      
      <PageHeader breadcrumbs={breadcrumbs} title="Configuración" description="Gestiona la configuración de tu cuenta y empresa" />
      <div className="grid gap-8 lg:grid-cols-3">
        {CLIENT_SETTINGS_NAV.map(group => (
          <section key={group.id} className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">{group.title}</h2>
            <div className="mt-4 space-y-3">
              {group.items.map((item) => {
                const Icon = ICONS[item.path] ?? Settings;
                const href = buildClientSettingsHref(basePath, item.path);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => router.push(href)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium text-slate-800">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
