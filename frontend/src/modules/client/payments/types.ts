export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export type PaymentMethodSummary = {
  id: string;
  name: string;
};

export type ClientPaymentSummary = {
  id: string;
  client_id: string;
  payment_method_id: string;
  value: string;
  type: string;
  code: string | null;
  url: string | null;
  status_pay: PaymentStatus;
  created: string | null;
  updated: string | null;
  payment_method: PaymentMethodSummary | null;
  invoice_consecutive?: string | null;
};

export type ClientPaymentRecord = {
  id: string;
  client_id: string;
  payment_method_id: string;
  value: string;
  type: string;
  code: string | null;
  url: string | null;
  status_pay: PaymentStatus;
  created: string | null;
  updated: string | null;
  client: {
    id: string;
    name: string;
  } | null;
  payment_method: PaymentMethodSummary | null;
};

export type ClientPaymentsPayload = {
  payments: ClientPaymentSummary[];
};

export type CreatePaymentInput = {
  payment_method_id: string;
  value: string;
  type: string;
  code?: string | null;
  url?: string | null;
};

export type ClientPaymentMethodsPayload = {
  methods: PaymentMethodSummary[];
};

// Nuevos tipos para el formulario de pago similar al admin
export type PaymentFormAttachment = {
  id?: string;
  url: string;
  invoiceId?: string | null;
  file?: File | null;
  isFile?: boolean;
};

export type PaymentFormValues = {
  value: string;
  status: string | null;
  methodId?: string | null;
  methodName?: string | null;
  receiptUrl?: string | null;
  type?: string | null;
  paidAt?: string | null;
  confirmed?: boolean | null;
  attachments: PaymentFormAttachment[];
};

export type InvoiceForPayment = {
  id: string;
  code: string | null;
  value: string | null;
  status_pay: string | null;
  created: string | null;
};

export type PaymentDataPayload = {
  methods: PaymentMethodSummary[];
  invoices: InvoiceForPayment[];
};
