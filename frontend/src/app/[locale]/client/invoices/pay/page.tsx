import InvoicePaymentForm from '@app/modules/client/invoices/components/InvoicePaymentForm';
import PageHeader from '@shared/components/common/PageHeader';

export default async function InvoicePayPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;

  const breadcrumbs = [
    { label: 'Panel cliente', href: `/${locale}/client/dashboard` },
    { label: 'Facturas', href: `/${locale}/client/invoices` },
    { label: 'Pagar factura' },
  ];

  return (
    <div className="px-6 py-8 lg:px-8">
      <PageHeader
        breadcrumbs={breadcrumbs}
        title="Pagar Factura"
        description="Realiza el pago de tu factura pendiente"
      />

      <div className="mt-6">
        <InvoicePaymentForm locale={locale} />
      </div>
    </div>
  );
}
