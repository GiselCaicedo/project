import PageHeader from '@shared/components/common/PageHeader';
import { cookies } from 'next/headers';

export default async function ClientHome() {
  void cookies; // mantiene la firma de componente de servidor coherente
  const breadcrumbs = [
    { label: 'Panel cliente' },
  ];
  return (
    <div className="px-6 py-8 lg:px-8">
      <PageHeader breadcrumbs={breadcrumbs} title="Panel Cliente" description="Bienvenido al panel del cliente." />
    </div>
  );
}
