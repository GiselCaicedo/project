import MainConfigClient from '@app/modules/client/config/components/MainConfigClient';

export default async function ClientConfigPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  return (
    <div className="px-6 py-8 lg:px-8">
      <MainConfigClient locale={locale} />
    </div>
  );
}
