import MainCompanyClient from '@app/modules/client/settings/components/MainCompanyClient';

export default async function CompanyDataPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return <MainCompanyClient locale={locale} />;
}
