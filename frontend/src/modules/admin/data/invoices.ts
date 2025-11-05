export type AdminInvoiceStatus = 'paid' | 'pending' | 'overdue' | 'cancelled';

export type AdminInvoiceListItem = {
  id: string;
  number: string;
  description?: string | null;
  clientId: string | null;
  clientName: string;
  amount: number;
  subtotal?: number | null;
  tax1?: number | null;
  tax2?: number | null;
  vatIncluded?: boolean | null;
  vatRate?: number | null;
  taxOne?: { amount?: number | null } | null;
  taxTwo?: { amount?: number | null } | null;
  includeIva?: boolean | null;
  quoteConsecutive?: string | null;
  issuedAt: string | null;
  dueAt: string | null;
  status: AdminInvoiceStatus;
  services: number;
  paymentsCount?: number;
};

export type AdminInvoiceLine = {
  id: string;
  item: number | null;
  serviceId: string | null;
  serviceName: string;
  unit: string | null;
  quantity: number;
  total: number;
};

export type AdminInvoiceAttachmentType = 'pdf' | 'xml' | 'zip';

export type AdminInvoiceAttachment = {
  id: string;
  type: AdminInvoiceAttachmentType;
  label: string;
};

export type AdminInvoicePayment = {
  id: string;
  url: string | null;
  created: string | null;
};

export type AdminInvoiceRecord = {
  id: string;
  number: string;
  description: string;
  clientId: string | null;
  clientName: string;
  amount: number;
  subtotal?: number | null;
  tax1?: number | null;
  tax2?: number | null;
  vatIncluded?: boolean | null;
  vatRate?: number | null;
  taxOne?: { amount?: number | null } | null;
  taxTwo?: { amount?: number | null } | null;
  includeIva?: boolean | null;
  quoteConsecutive?: string | null;
  issuedAt: string | null;
  dueAt: string | null;
  status: AdminInvoiceStatus;
  url: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  details: AdminInvoiceLine[];
  attachments: AdminInvoiceAttachment[];
  payments?: AdminInvoicePayment[];
};

export type AdminInvoiceCatalog = {
  clients: Array<{ id: string; name: string }>;
  services: Array<{
    id: string;
    name: string;
    unit: string | null;
    price: number | null;
    subtotal: number | null;
  }>;
};

export type PersistAdminInvoiceInput = {
  clientId: string;
  serviceId: string;
  number: string;
  description?: string | null;
  amount: number;
  status: 'paid' | 'pending' | 'cancelled';
  subtotal: number;
  tax1?: number | null;
  tax2?: number | null;
  vatIncluded?: boolean;
  vatRate?: number | null;
  issuedAt?: string | null;
  dueAt?: string | null;
  url?: string | null;
  documentFile?: File | null;
  details: Array<{
    serviceId: string;
    quantity: number;
    total: number;
    item?: number | null;
  }>;
};
