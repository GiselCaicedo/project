export type QuoteStatus = 'pendiente' | 'aprobada' | 'rechazada';

export type QuoteServiceDetail = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  unit: string | null;
  frequency: string | null;
};

export type QuoteDetailItem = {
  id: string;
  quote_id: string;
  service_id: string;
  item: number;
  quantity: number;
  total_value: number;
  service: QuoteServiceDetail | null;
};

export type ClientQuoteSummary = {
  id: string;
  client_id: string;
  consecutive: string | null;
  reference: string | null;
  description: string | null;
  value: number;
  subtotal: number | null;
  tax_one: number | null;
  tax_two: number | null;
  total: number | null;
  url: string | null;
  created: string | null;
  updated: string | null;
  status: QuoteStatus;
  quote_detail: QuoteDetailItem[];
  invoice?: ClientQuoteInvoiceSummary | null;
};

export type ClientQuoteRecord = {
  id: string;
  client_id: string;
  consecutive: string | null;
  reference: string | null;
  description: string | null;
  value: number;
  subtotal: number | null;
  tax_one: number | null;
  tax_two: number | null;
  total: number | null;
  url: string | null;
  created: string | null;
  updated: string | null;
  client: {
    id: string;
    name: string;
  } | null;
  quote_detail: QuoteDetailItem[];
  quote_attachment: Array<{
    id: string;
    quote_id: string;
    invoice_id: string | null;
  }>;
  status: QuoteStatus;
  invoice?: ClientQuoteInvoiceSummary | null;
};

export type InvoiceStatus = 'pagada' | 'pendiente';

export type ClientQuoteInvoiceSummary = {
  id: string | null;
  number: string | null;
  status: InvoiceStatus;
  amount: number | null;
};

export type ClientQuotesPayload = {
  quotes: ClientQuoteSummary[];
};

export type GenerateInvoiceResult = {
  success: boolean;
  invoiceId: string;
  message?: string;
};

export type CreateClientQuoteInput = {
  description?: string | null;
  services: Array<{
    serviceId: string;
    quantity: number;
    unitPrice?: number | null;
    total?: number | null;
  }>;
};

export type QuoteComment = {
  id: string;
  quoteId: string;
  userId: string | null;
  content: string;
  created: string | null;
  updated: string | null;
  status: boolean | null;
};

export type CreateCommentInput = {
  content: string;
};

export type UpdateCommentInput = {
  content: string;
};

export type ApproveQuoteResult = {
  id: string;
  status: 'aprobada';
  updated: string | null;
};
