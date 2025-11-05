import MainReportsClient from '@app/modules/client/reports/components/MainReportsClient';
import {
  getClientAccountStatementApi,
  getClientFinancialSummaryApi,
  getClientInvoicesReportApi,
  getClientPaymentsReportApi,
  getClientServicesStatusReportApi,
} from '@shared/services/conexion';
import { cookies } from 'next/headers';

export default async function ClientReportPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  void locale;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  let summary: Awaited<ReturnType<typeof getClientFinancialSummaryApi>> | null = null;
  let invoicesReport: Awaited<ReturnType<typeof getClientInvoicesReportApi>> | null = null;
  let paymentsReport: Awaited<ReturnType<typeof getClientPaymentsReportApi>> | null = null;
  let servicesStatus: Awaited<ReturnType<typeof getClientServicesStatusReportApi>> | null = null;
  let accountStatement: Awaited<ReturnType<typeof getClientAccountStatementApi>> | null = null;
  const errors: string[] = [];

  try {
    summary = await getClientFinancialSummaryApi(token);
  } catch (e: any) {
    errors.push(e?.message ?? 'No fue posible cargar el resumen financiero.');
  }

  try {
    invoicesReport = await getClientInvoicesReportApi(undefined, undefined, token);
  } catch (e: any) {
    errors.push(e?.message ?? 'No fue posible cargar el reporte de facturas.');
  }

  try {
    paymentsReport = await getClientPaymentsReportApi(undefined, undefined, token);
  } catch (e: any) {
    errors.push(e?.message ?? 'No fue posible cargar el reporte de pagos.');
  }

  try {
    servicesStatus = await getClientServicesStatusReportApi(token);
  } catch (e: any) {
    errors.push(e?.message ?? 'No fue posible cargar el estado de los servicios.');
  }

  try {
    accountStatement = await getClientAccountStatementApi(undefined, undefined, token);
  } catch (e: any) {
    errors.push(e?.message ?? 'No fue posible cargar el estado de cuenta.');
  }

  return (
    <div className="px-6 py-8 lg:px-8">
      <MainReportsClient
        summary={summary}
        invoicesReport={invoicesReport}
        paymentsReport={paymentsReport}
        servicesStatusReport={servicesStatus}
        accountStatement={accountStatement}
        errorMessages={errors}
      />
    </div>
  );
}
