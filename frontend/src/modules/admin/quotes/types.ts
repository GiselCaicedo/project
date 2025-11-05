export type QuoteStatus = 'pendiente' | 'aprobada' | 'rechazada';

export type QuoteActionType = 'pdf' | 'email' | 'invoice';

export type QuoteSummary = {
  id: string;
  reference: string;
  description: string | null;
  client: {
    id: string | null;
    name: string;
  };
  issuedAt: string | null;
  updatedAt: string | null;
  status: QuoteStatus;
  services: number;
  amount: number;
  pdfUrl: string | null;
  invoice: QuoteInvoiceSummary | null;
};

export type QuoteInvoiceSummary = {
  id: string | null;
  consecutive?: string | null;
  number: string | null;
  status: QuoteStatus | 'en_proceso';
  amount: number | null;
};

export type QuoteServiceEntry = {
  id: string;
  serviceId: string | null;
  serviceName: string;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  total: number;
  status: QuoteStatus;
};

export type QuoteAttachmentEntry = {
  id: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  invoiceStatus: QuoteStatus | 'en_proceso';
  invoiceAmount: number;
  invoiceUrl: string | null;
};

export type QuoteAction = {
  type: QuoteActionType;
  label: string;
  available: boolean;
  url?: string | null;
  disabledReason?: string | null;
};

export type QuoteObservation = {
  id: string;
  quoteId: string;
  userId: string | null;
  content: string;
  created: string | null;
  updated: string | null;
  status: boolean | null;
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

export type QuoteDetail = {
  id: string;
  reference: string;
  description: string | null;
  status: QuoteStatus;
  amount: number;
  issuedAt: string | null;
  updatedAt: string | null;
  client: {
    id: string | null;
    name: string;
  };
  services: QuoteServiceEntry[];
  attachments: QuoteAttachmentEntry[];
  actions: QuoteAction[];
  observations: QuoteObservation[];
  comments: QuoteComment[];
};

export type SendQuoteEmailInput = {
  recipients: string[];
  message?: string | null;
};

export type QuotePdfResult = {
  id: string;
  url: string | null;
  generatedAt: string | null;
};

export type QuoteEmailResult = {
  id: string;
  subject: string;
  recipients: string[];
  message: string | null;
  sentAt: string;
};

export type QuoteInvoiceResult = {
  invoiceId: string;
  alreadyConverted: boolean;
  description?: string | null;
  amount?: number | null;
  createdAt?: string | null;
};

export type UpdateQuoteInput = {
  description?: string | null;
  status?: QuoteStatus | null;
  amount?: number | null;
  url?: string | null;
};

export type QuoteServiceInput = {
  serviceId: string;
  quantity: number;
  unitPrice?: number | null;
  total?: number | null;
};

export type CreateQuoteInput = {
  clientId: string;
  description?: string | null;
  issuedAt?: string | null;
  services: QuoteServiceInput[];
};

export type CreateObservationInput = {
  content: string;
};

export type UpdateObservationInput = {
  content: string;
};
