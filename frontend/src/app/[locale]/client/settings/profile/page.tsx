import MainProfileClient from '@app/modules/client/settings/components/MainProfileClient';

export default async function UserProfilePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return <MainProfileClient locale={locale} />;
}
