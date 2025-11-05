export type ServiceStatus = 'active' | 'inactive';

export type ServiceCategoryRecord = {
  id: string;
  name: string;
};

export type ServiceTaxSummary = {
  id: string;
  name: string;
  percentage: number;
};

export type ClientServiceSummary = {
  id: string;
  serviceId: string;
  name: string;
  description: string | null;
  unit: string | null;
  price: number | null;
  frequency: string | null;
  category: ServiceCategoryRecord | null;
  started: string | null;
  delivery: string | null;
  expiry: string | null;
  status: ServiceStatus;
  observations?: ServiceObservation[];
};

export type ServiceUsageRecord = {
  id: string;
  startDate: string | null;
  endDate: string | null;
  usage: string | null;
  status: string | null;
  createdAt: string | null;
};

export type ServiceObservation = {
  id: string;
  content: string;
  created: string | null;
  updated: string | null;
};

export type ClientServiceDetail = {
  id: string;
  serviceId: string;
  name: string;
  description: string | null;
  unit: string | null;
  price: number | null;
  subtotal: number | null;
  frequency: string | null;
  category: ServiceCategoryRecord | null;
  taxOne: ServiceTaxSummary | null;
  taxTwo: ServiceTaxSummary | null;
  started: string | null;
  delivery: string | null;
  expiry: string | null;
  urlApi: string | null;
  tokenApi: string | null;
  status: ServiceStatus;
  usage: ServiceUsageRecord[];
  observations?: ServiceObservation[];
};

export type ClientServicesPayload = {
  services: ClientServiceSummary[];
};
