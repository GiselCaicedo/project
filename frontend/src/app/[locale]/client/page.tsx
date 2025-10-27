import { redirect } from 'next/navigation';

export default async function ClientRoot(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  redirect(`/${locale}/client/dashboard`);
}
