import AllowedMethodsView from '@app/modules/admin/settings/payments/AllowedMethodsView';

export default async function PaymentMethodsSettingsPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return (
    <div className="px-6 py-8 lg:px-8">
      <AllowedMethodsView locale={locale} />
    </div>
  );
}
