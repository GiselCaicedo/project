import PayInvoicePage from '@app/modules/client/invoices/components/PayInvoicePage';

export default async function InvoicePaymentPage(props: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await props.params;

  return <PayInvoicePage locale={locale} invoiceId={id} />;
}
