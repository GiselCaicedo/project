import { RechargeBalanceForm } from '@app/modules/client/payments/components/RechargeBalanceForm';
import PageHeader from '@shared/components/common/PageHeader';

export default async function NewPaymentPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Pagos', href: `/${locale}/client/payments` },
    { label: 'Recargar saldo' },
  ];

  return (
    <div className="px-6 py-8 lg:px-8">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Recargar Saldo"
        description="Recarga tu saldo para seguir usando nuestros servicios"
      />
      <div className="mt-6">
        <RechargeBalanceForm locale={locale} />
      </div>
    </div>
  );
}
