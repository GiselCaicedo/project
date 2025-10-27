'use client';

import PageHeader from '@shared/components/common/PageHeader';
import type {
  AccountStatement,
  FinancialSummary,
  InvoicesReport,
  PaymentsReport,
  ServicesStatusReport,
} from '@app/modules/client/reports/types';

const currencyFormatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
const dateFormatter = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

type Props = {
  summary: FinancialSummary | null;
  invoicesReport: InvoicesReport | null;
  paymentsReport: PaymentsReport | null;
  servicesStatusReport: ServicesStatusReport | null;
  accountStatement: AccountStatement | null;
  errorMessages: string[];
};

export default function MainReportsClient({
  summary,
  invoicesReport,
  paymentsReport,
  servicesStatusReport,
  accountStatement,
  errorMessages,
}: Props) {
  const hasData
    = summary || invoicesReport || paymentsReport || servicesStatusReport || accountStatement;

  return (
    <div className="space-y-8">
      <PageHeader title="Reportes" description="Reportes y métricas de tu cuenta." />

      {errorMessages.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">No fue posible cargar toda la información:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-amber-800">
            {errorMessages.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      {summary && <FinancialSummarySection summary={summary} />}
      {invoicesReport && <InvoicesReportSection report={invoicesReport} />}
      {paymentsReport && <PaymentsReportSection report={paymentsReport} />}
      {servicesStatusReport && <ServicesStatusSection report={servicesStatusReport} />}
      {accountStatement && <AccountStatementSection report={accountStatement} />}

      {!hasData && errorMessages.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          No se encontraron datos para mostrar.
        </div>
      )}
    </div>
  );
}

function FinancialSummarySection({ summary }: { summary: FinancialSummary }) {
  const { summary: data, generatedAt } = summary;
  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Resumen financiero</h2>
          <p className="text-xs text-gray-500">Generado el {formatDate(generatedAt)}</p>
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card label="Facturas emitidas" value={data.totalInvoices} />
        <Card label="Monto facturado" value={formatCurrency(data.totalInvoiced)} />
        <Card label="Pagos completados" value={formatCurrency(data.totalPaid)} />
        <Card label="Balance" value={formatCurrency(data.balance)} />
        <Card label="Facturas pendientes" value={data.pendingInvoices} />
        <Card label="Facturas vencidas" value={data.overdueInvoices} />
        <Card label="Servicios activos" value={data.activeServices} />
      </div>
    </section>
  );
}

function InvoicesReportSection({ report }: { report: InvoicesReport }) {
  const { period, totals, invoices, generatedAt } = report;
  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Reporte de facturas</h2>
          <p className="text-xs text-gray-500">
            Periodo: {periodLabel(period.startDate, period.endDate)} · Generado el {formatDate(generatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span>Total facturas: {totals.count}</span>
          <span>Subtotal: {formatCurrency(totals.subtotal)}</span>
          <span>Impuesto 1: {formatCurrency(totals.taxOne)}</span>
          <span>Impuesto 2: {formatCurrency(totals.taxTwo)}</span>
          <span>Total: {formatCurrency(totals.total)}</span>
        </div>
      </header>
      {invoices.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Descripción</th>
                <th className="px-3 py-2 text-left font-medium">Servicio</th>
                <th className="px-3 py-2 text-left font-medium">Fecha</th>
                <th className="px-3 py-2 text-left font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {invoices.map(invoice => (
                <tr key={invoice.id}>
                  <td className="px-3 py-2 text-gray-700">{invoice.description ?? 'Factura sin descripción'}</td>
                  <td className="px-3 py-2 text-gray-700">{invoice.service?.name ?? 'Sin servicio asociado'}</td>
                  <td className="px-3 py-2 text-gray-700">{formatDate(invoice.created)}</td>
                  <td className="px-3 py-2 text-gray-700">{formatCurrency(invoice.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No hay facturas registradas en el periodo seleccionado.</p>
      )}
    </section>
  );
}

function PaymentsReportSection({ report }: { report: PaymentsReport }) {
  const { period, totals, payments, generatedAt } = report;
  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Reporte de pagos</h2>
          <p className="text-xs text-gray-500">
            Periodo: {periodLabel(period.startDate, period.endDate)} · Generado el {formatDate(generatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span>Total pagos: {totals.count}</span>
          <span>Monto total: {formatCurrency(totals.totalAmount)}</span>
        </div>
      </header>
      {payments.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Código</th>
                <th className="px-3 py-2 text-left font-medium">Método</th>
                <th className="px-3 py-2 text-left font-medium">Estado</th>
                <th className="px-3 py-2 text-left font-medium">Fecha</th>
                <th className="px-3 py-2 text-left font-medium">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {payments.map(payment => (
                <tr key={payment.id}>
                  <td className="px-3 py-2 text-gray-700">{payment.code ?? payment.id}</td>
                  <td className="px-3 py-2 text-gray-700">{payment.payment_method?.name ?? 'No especificado'}</td>
                  <td className="px-3 py-2 text-gray-700">{formatStatus(payment.status_pay)}</td>
                  <td className="px-3 py-2 text-gray-700">{formatDate(payment.created)}</td>
                  <td className="px-3 py-2 text-gray-700">{formatCurrency(Number(payment.value))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No hay pagos registrados en el periodo seleccionado.</p>
      )}
      {Object.keys(totals.byStatus).length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
          <p className="text-sm font-semibold text-gray-900">Totales por estado</p>
          <ul className="mt-2 space-y-1">
            {Object.entries(totals.byStatus).map(([status, info]) => (
              <li key={status} className="flex items-center justify-between">
                <span>{formatStatus(status)}</span>
                <span>{info.count} · {formatCurrency(info.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ServicesStatusSection({ report }: { report: ServicesStatusReport }) {
  const { summary, services, generatedAt } = report;
  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Estado de servicios</h2>
          <p className="text-xs text-gray-500">Generado el {formatDate(generatedAt)}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span>Activos: {summary.active}</span>
          <span>Por vencer: {summary.expiringSoon}</span>
          <span>Vencidos: {summary.expired}</span>
          <span>Total: {summary.total}</span>
        </div>
      </header>
      <div className="grid gap-4 lg:grid-cols-3">
        <ServiceStatusList title="Activos" items={services.active} emptyMessage="Sin servicios activos." />
        <ServiceStatusList title="Por vencer" items={services.expiringSoon} emptyMessage="Sin servicios próximos a vencer." />
        <ServiceStatusList title="Vencidos" items={services.expired} emptyMessage="Sin servicios vencidos." />
      </div>
    </section>
  );
}

function AccountStatementSection({ report }: { report: AccountStatement }) {
  const { period, summary, transactions, generatedAt } = report;
  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Estado de cuenta</h2>
          <p className="text-xs text-gray-500">
            Periodo: {periodLabel(period.startDate, period.endDate)} · Generado el {formatDate(generatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span>Total facturas: {formatCurrency(summary.totalInvoices)} ({summary.invoicesCount})</span>
          <span>Total pagos: {formatCurrency(summary.totalPayments)} ({summary.paymentsCount})</span>
          <span>Balance: {formatCurrency(summary.balance)}</span>
        </div>
      </header>
      {transactions.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Tipo</th>
                <th className="px-3 py-2 text-left font-medium">Descripción</th>
                <th className="px-3 py-2 text-left font-medium">Fecha</th>
                <th className="px-3 py-2 text-left font-medium">Detalle</th>
                <th className="px-3 py-2 text-left font-medium">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {transactions.map((tx) => (
                <tr key={`${tx.type}-${tx.id}`}>
                  <td className="px-3 py-2 text-gray-700">{tx.type === 'invoice' ? 'Factura' : 'Pago'}</td>
                  <td className="px-3 py-2 text-gray-700">{tx.description}</td>
                  <td className="px-3 py-2 text-gray-700">{formatDate(tx.date)}</td>
                  <td className="px-3 py-2 text-gray-700">
                    {tx.type === 'invoice'
                      ? `Vence: ${formatDate(tx.dueDate ?? null)}`
                      : `Estado: ${formatStatus(tx.status ?? '-')}`}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{formatCurrency(tx.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No hay transacciones registradas para el periodo.</p>
      )}
    </section>
  );
}

function ServiceStatusList({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: ServicesStatusReport['services']['active'];
  emptyMessage: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="text-sm text-gray-700">
              <p className="font-medium text-gray-900">{item.service?.name ?? 'Servicio sin nombre'}</p>
              <p className="text-xs text-gray-500">
                {item.service?.frequency ? `${item.service.frequency} · ` : ''}Precio: {formatCurrency(item.service?.price ?? 0)}
              </p>
              <p className="text-xs text-gray-500">Inicio: {formatDate(item.started)} · Vence: {formatDate(item.expiry)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-gray-500">{emptyMessage}</p>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '-';
  return currencyFormatter.format(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return dateFormatter.format(date);
}

function periodLabel(start: string, end: string) {
  if (start === 'all' && end === 'all') return 'Todos los registros';
  if (start === 'all') return `Hasta ${end}`;
  if (end === 'all') return `Desde ${start}`;
  return `${start} – ${end}`;
}

function formatStatus(status: string | undefined) {
  const normalized = status?.toLowerCase?.() ?? '';
  switch (normalized) {
    case 'pending':
      return 'Pendiente';
    case 'completed':
      return 'Completado';
    case 'failed':
      return 'Fallido';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status ?? '-';
  }
}
