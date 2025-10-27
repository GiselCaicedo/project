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
