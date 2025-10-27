export type FinancialSummaryData = {
  totalInvoices: number;
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
  pendingInvoices: number;
  overdueInvoices: number;
  activeServices: number;
};

export type FinancialSummary = {
  summary: FinancialSummaryData;
  generatedAt: string;
};

export type InvoiceReportItem = {
  id: string;
  description: string | null;
  total: number;
  subtotal: number;
  tax_one: number | null;
  tax_two: number | null;
  created: string | null;
  service: {
    name: string;
    description: string | null;
  } | null;
  invoice_detail: Array<{
    id: string;
    quantity: number;
    total_value: number;
    service: {
      name: string;
      price: number | null;
    } | null;
  }>;
};

export type InvoicesReport = {
  period: {
    startDate: string;
    endDate: string;
  };
  invoices: InvoiceReportItem[];
  totals: {
    count: number;
    subtotal: number;
    taxOne: number;
    taxTwo: number;
    total: number;
  };
  generatedAt: string;
};

export type PaymentReportItem = {
  id: string;
  code: string | null;
  value: string;
  type: string;
  status_pay: string;
  created: string | null;
  payment_method: {
    name: string;
  } | null;
};

export type PaymentsReport = {
  period: {
    startDate: string;
    endDate: string;
  };
  payments: PaymentReportItem[];
  totals: {
    count: number;
    totalAmount: number;
    byStatus: Record<string, { count: number; total: number }>;
  };
  generatedAt: string;
};

export type ServiceStatusItem = {
  id: string;
  started: string | null;
  delivery: string | null;
  expiry: string | null;
  service: {
    name: string;
    description: string | null;
    price: number | null;
    frequency: string | null;
  } | null;
};

export type ServicesStatusReport = {
  summary: {
    active: number;
    expiringSoon: number;
    expired: number;
    total: number;
  };
  services: {
    active: ServiceStatusItem[];
    expiringSoon: ServiceStatusItem[];
    expired: ServiceStatusItem[];
  };
  generatedAt: string;
};

export type TransactionItem = {
  type: 'invoice' | 'payment';
  id: string;
  description: string;
  amount: number;
  date: string | null;
  dueDate?: string | null;
  status?: string;
};

export type AccountStatement = {
  period: {
    startDate: string;
    endDate: string;
  };
  transactions: TransactionItem[];
  summary: {
    totalInvoices: number;
    totalPayments: number;
    balance: number;
    invoicesCount: number;
    paymentsCount: number;
  };
  generatedAt: string;
};
