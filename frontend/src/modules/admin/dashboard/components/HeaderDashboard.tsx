'use client';

import PageHeader from '@shared/components/common/PageHeader';

type HeaderDashboardProps = {
  locale: string;
};

export default function HeaderDashboard({ locale }: HeaderDashboardProps) {
  const breadcrumbs = [
    { label: 'Panel admin', href: `/${locale}/admin/dashboard` },
  ];

  return (
    <PageHeader
      breadcrumbs={breadcrumbs}
      title="Dashboard"
      description="[Descripción pendiente["
    />
  );
}
