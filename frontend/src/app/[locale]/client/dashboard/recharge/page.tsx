import { RechargeBalanceForm } from '@app/modules/client/payments/components/RechargeBalanceForm';

export default async function NewPaymentPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;

  return (
    <div className="px-6 py-8 lg:px-8">
      <div className="mt-6">
        <RechargeBalanceForm locale={locale} />
      </div>
    </div>
  );
}
