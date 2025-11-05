/**
 * Tipos para el Dashboard del Cliente
 */

export type ClientBalanceSummary = {
  totalBalance: number;
  totalSpent: number;
  totalPending: number;
};

export type ServiceConsumption = {
  serviceId: string;
  serviceName: string;
  consumption: number;
  lastUsage: string | null;
};

export type ExpirationItem = {
  id: string;
  type: 'invoice' | 'service';
  name: string;
  description: string | null;
  amount: number;
  expiry: string | null;
  daysUntilExpiry: number | null;
  status: 'active' | 'pending' | 'expired';
  url: string | null;
};

export type ClientDashboardData = {
  balance: ClientBalanceSummary;
  serviceConsumption: ServiceConsumption[];
  expirations: ExpirationItem[];
};

export type ClientDashboardResponse = {
  success: boolean;
  data: ClientDashboardData;
  fetchedAt: string;
};
