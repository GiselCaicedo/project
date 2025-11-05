import type { PaymentMethodSummary } from '@app/modules/client/payments/types';
import ClientPaymentMethodsManager from '@app/modules/client/payments/components/ClientPaymentMethodsManager';

export default async function ClientMethodPayPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const mockMethods: PaymentMethodSummary[] = [
    { id: 'card', name: 'Tarjeta' },
    { id: 'transfer', name: 'Transferencia' },
    { id: 'cash', name: 'Efectivo' },
  ];
  return (
    <div className="px-6 py-8 lg:px-8">
      <ClientPaymentMethodsManager initialMethods={mockMethods} locale={locale} />
    </div>
  );
}
