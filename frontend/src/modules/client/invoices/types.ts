export type ClientInvoiceStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';

export type ClientInvoiceService = {
  id: string;
  name: string;
  description: string | null;
  price?: number | null;
  unit?: string | null;
  frequency?: string | null;
};

export type ClientInvoiceDetail = {
  id: string;
  item: number;
  quantity: number;
  total_value: number;
  service: ClientInvoiceService | null;
};

export type ClientInvoiceSummary = {
  id: string;
  consecutive: string | null;
  description: string | null;
  value: number | null;
  url: string | null;
  subtotal: number;
  tax_one: number | null;
  tax_two: number | null;
  total: number;
  include_iva: boolean;
  expiry: string | null;
  created: string | null;
  service: ClientInvoiceService | null;
  invoice_detail: ClientInvoiceDetail[];
};

export type ClientInvoiceRecord = {
  id: string;
  client_id: string;
  consecutive: string | null;
  description: string | null;
  value: number | null;
  url: string | null;
  subtotal: number;
  tax_one: number | null;
  tax_two: number | null;
  total: number;
  include_iva: boolean;
  expiry: string | null;
  created: string | null;
  updated: string | null;
  client: {
    id: string;
    name: string;
  } | null;
  service: ClientInvoiceService | null;
  invoice_detail: ClientInvoiceDetail[];
  payment_attachment: Array<{
    id: string;
    payment_id: string | null;
    invoice_id: string | null;
    url: string | null;
  }>;
};

export type ClientInvoicesPayload = {
  invoices: ClientInvoiceSummary[];
};
