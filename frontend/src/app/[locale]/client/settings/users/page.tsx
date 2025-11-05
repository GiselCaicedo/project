import MainUsersClient from '@app/modules/client/settings/components/MainUsersClient';

export default async function ClientUsersPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return <MainUsersClient locale={locale} />;
}
