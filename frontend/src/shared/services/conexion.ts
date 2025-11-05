// @ts-nocheck
import type {
  AssignServiceInput,
  ClientDetailValue,
  ClientParameter,
  ClientRecord,
  ClientService,
  ServiceCatalogEntry,
} from '@admin/clients/types';
import type { AdminDashboardSummary } from '@admin/dashboard/types';
import type {
  AdminInvoiceCatalog,
  AdminInvoiceListItem,
  AdminInvoiceRecord,
  PersistAdminInvoiceInput,
} from '@admin/data/invoices';
import type {
  PaymentFormValues,
  PaymentListPayload,
  PaymentMethod,
  PaymentRecord,
} from '@admin/payments/types';
import type {
  CreateQuoteInput,
  QuoteDetail,
  QuoteEmailResult,
  QuoteInvoiceResult,
  QuotePdfResult,
  QuoteServiceInput,
  QuoteSummary,
  SendQuoteEmailInput,
  UpdateQuoteInput,
} from '@admin/quotes/types';
import type { ServiceRequestRecord, ServiceRequestStatus } from '@admin/services/requests/types';
import type {
  PersistServiceInput,
  ServiceCategory,
  ServiceDetail,
  ServiceListPayload,
  ServiceRecord,
} from '@admin/services/types';
import type { PersistTaxInput, TaxRecord } from '@admin/settings/taxes/types';
import type {
  ClientInvoiceRecord,
  ClientInvoicesPayload,
} from '@app/modules/client/invoices/types';
import type {
  ClientPaymentRecord,
  ClientPaymentsPayload,
  CreatePaymentInput,
} from '@app/modules/client/payments/types';
import type {
  ClientQuoteRecord,
  ClientQuotesPayload,
  GenerateInvoiceResult,
} from '@app/modules/client/quotes/types';
import type {
  AccountStatement,
  FinancialSummary,
  InvoicesReport,
  PaymentsReport,
  ServicesStatusReport,
} from '@app/modules/client/reports/types';
// ==========================
// Client panel - Services
// ==========================
import type {
  ClientServiceDetail,
  ClientServicesPayload,
} from '@app/modules/client/services/types';
import type {
  ClientDashboardData,
} from '@client/dashboard/types';
import type {
  ClientInvoiceRecord,
  ClientInvoiceSummary,
} from '@client/invoices/types';

import type {
  ClientPaymentRecord,
  ClientPaymentSummary,
  CreatePaymentInput,
  PaymentMethodSummary,
} from '@client/payments/types';
import type {
  ClientQuoteInvoiceSummary,
  ClientQuoteRecord,
  ClientQuoteSummary,
  CreateClientQuoteInput,
  GenerateInvoiceResult,
} from '@client/quotes/types';
import type {
  AccountStatement,
  FinancialSummary,
  InvoicesReport,
  PaymentsReport,
  ServicesStatusReport,
} from '@client/reports/types';
import type {
  ClientServiceDetail,
  ClientServiceSummary,
} from '@client/services/types';
import axios from 'axios';

// Resolver URL del backend
const RESOLVED_API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL
  || (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : '');
if (!RESOLVED_API_URL) {
  // Aviso claro en consola del navegador/SSR
  // eslint-disable-next-line no-console
  console.error('[Config] Falta NEXT_PUBLIC_BACKEND_URL. DefÃ­nela en .env.local');
}
// Log del baseURL para diagnÃ³stico
// eslint-disable-next-line no-console
if (typeof window === 'undefined') {
  console.log(`[SSR-API] baseURL=${RESOLVED_API_URL}`)
} else {
  console.log(`[API] baseURL=${RESOLVED_API_URL}`)
}

export type InvoiceObservation = {
  id: string;
  invoiceId: string;
  userId: string | null;
  content: string;
  created: string | null;
  updated: string | null;
  status: boolean | null;
};
export type InvoiceComment = {
  id: string;
  invoiceId: string;
  userId: string | null;
  content: string;
  created: string | null;
  updated: string | null;
  status: boolean | null;
};

// Obsoleto: usar RESOLVED_API_URL
// const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const TOKEN_STORAGE_KEY = 'auth_token';

export const api = axios.create({
  baseURL: RESOLVED_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Rate limiter para prevenir mÃºltiples llamadas simultÃ¡neas al mismo endpoint
const pendingRequests = new Map<string, Promise<any>>();
const lastRequestTime = new Map<string, number>();
const MIN_REQUEST_INTERVAL = 1000; // ms entre solicitudes al mismo endpoint
const requestCounts = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 3; // MÃ¡ximo 3 solicitudes por minuto al mismo endpoint

const AUTH_COOKIE = 'auth_token';

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return (
      window.sessionStorage.getItem(TOKEN_STORAGE_KEY)
      ?? window.localStorage.getItem(TOKEN_STORAGE_KEY)
      ?? null
    );
  } catch (error) {
    console.warn('Unable to read auth token from storage:', error);
    return null;
  }
};

const setAuthCookie = (token: string) => {
  if (typeof document === 'undefined') {
    return;
  }
  const oneDay = 60 * 60 * 24;
  const secure
    = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${AUTH_COOKIE}=${token}; Path=/; Max-Age=${oneDay}; SameSite=Lax${secure}`;
};

const clearAuthCookie = () => {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Status 401 (sesiÃ³n expirada)
api.interceptors.response.use(
  response => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/es/sign-in';
    }
    return Promise.reject(error);
  },
);

export type BackendUser = {
  id: string;
  user?: string | null;
  usuario?: string | null;
  name?: string | null;
  status: boolean;
  updated?: string | null;
  updatedAt?: string | null;
  role?: { id?: string; name: string };
  client?: { id: string; name: string } | null;
};

export type RoleCategory = 'admin' | 'client';

export type Role = {
  id: string;
  name: string;
  description?: string | null;
  status?: boolean;
  updated?: string | null;
  panel?: RoleCategory | null;
};

const panel_ALIASES: Record<RoleCategory, string[]> = {
  admin: ['ADMIN', 'panel_admin'],
  client: ['CLIENT', 'cliente', 'panel_client'],
};

export async function getClientsApi(): Promise<Client[]> {
  try {
    const { data } = await api.get('/utils/get-client');
    if (!Array.isArray(data)) {
      throw new TypeError('Respuesta inesperada del servidor');
    }
    return data;
  } catch (error: any) {
    console.error('getClientsApi error:', error);
    throw new Error(error?.response?.data?.message || 'Error al obtener clientes');
  }
}

const parseTaxRecord = (payload: any): TaxRecord => {
  if (payload && typeof payload === 'object') {
    const rawId = (payload as any).id ?? (payload as any)._id;
    const fallbackId = `tax-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return {
      id: String(rawId ?? fallbackId),
      name: (payload as any).name ?? 'Sin nombre',
      description: (payload as any).description ?? null,
      rate: Number((payload as any).rate ?? 0),
      active: Boolean((payload as any).active ?? true),
      createdAt: (payload as any).createdAt ?? null,
      updatedAt: (payload as any).updatedAt ?? null,
    };
  }
  throw new Error('Respuesta inesperada al transformar impuesto');
};

const parseTaxList = (payload: any): TaxRecord[] => {
  if (Array.isArray(payload)) {
    return payload.map(parseTaxRecord);
  }
  if (Array.isArray(payload?.data)) {
    return payload.data.map(parseTaxRecord);
  }
  if (Array.isArray(payload?.taxes)) {
    return payload.taxes.map(parseTaxRecord);
  }
  return [];
};

export async function getAdminTaxesApi(token?: string): Promise<TaxRecord[]> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/settings/taxes', config);
    const result = parseTaxList(data);
    if (
      result.length === 0
      && !Array.isArray(data)
      && !Array.isArray(data?.data)
      && !Array.isArray(data?.taxes)
    ) {
      throw new Error('Respuesta inesperada al obtener los impuestos');
    }
    return result;
  } catch (error: any) {
    console.error('getAdminTaxesApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener los impuestos');
    }
    throw error;
  }
}

export async function createAdminTaxApi(payload: PersistTaxInput): Promise<TaxRecord> {
  try {
    const { data } = await api.post('/settings/taxes', payload);
    if (data) {
      return parseTaxRecord(data?.data ?? data?.tax ?? data);
    }
    throw new Error('Respuesta inesperada al crear el impuesto');
  } catch (error: any) {
    console.error('createAdminTaxApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible crear el impuesto');
    }
    throw error;
  }
}

export async function updateAdminTaxApi(id: string, payload: PersistTaxInput): Promise<TaxRecord> {
  try {
    const { data } = await api.put(`/settings/taxes/${id}`, payload);
    if (data) {
      return parseTaxRecord(data?.data ?? data?.tax ?? data);
    }
    throw new Error('Respuesta inesperada al actualizar el impuesto');
  } catch (error: any) {
    console.error('updateAdminTaxApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar el impuesto');
    }
    throw error;
  }
}

export async function deleteAdminTaxApi(id: string): Promise<void> {
  try {
    await api.delete(`/settings/taxes/${id}`);
  } catch (error: any) {
    console.error('deleteAdminTaxApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible eliminar el impuesto');
    }
    throw error;
  }
}

export async function getClientServicesListApi(token?: string): Promise<ClientServicesPayload> {
  const config = buildAuthConfig(token);
  const { data } = await api.get('/client/services', config);
  if (data?.success && data?.data) {
    return data.data as ClientServicesPayload;
  }
  if (Array.isArray(data?.services)) {
    return data as ClientServicesPayload;
  }
  throw new Error(data?.message ?? 'Error al obtener servicios');
}

// ==========================
// Client panel - Quotes
// ==========================
export async function getClientQuotesListApi(token?: string): Promise<ClientQuotesPayload> {
  const config = buildAuthConfig(token);
  const { data } = await api.get('/client/quotes', config);
  if (data?.success && data?.data) {
    return data.data as ClientQuotesPayload;
  }
  if (Array.isArray(data?.quotes)) {
    return data as ClientQuotesPayload;
  }
  throw new Error(data?.message ?? 'Error al obtener cotizaciones');
}

// ==========================
// Client panel - Invoices
// ==========================
export async function getClientInvoicesListApi(token?: string): Promise<ClientInvoicesPayload> {
  const config = buildAuthConfig(token);
  const { data } = await api.get('/client/invoices', config);
  if (data?.success && data?.data) {
    return data.data as ClientInvoicesPayload;
  }
  if (Array.isArray(data?.invoices)) {
    return data as ClientInvoicesPayload;
  }
  throw new Error(data?.message ?? 'Error al obtener facturas');
}

// ==========================
// Client panel - Payments
// ==========================
export async function getClientPaymentsListApi(token?: string): Promise<ClientPaymentsPayload> {
  const config = buildAuthConfig(token);
  const { data } = await api.get('/client/payments', config);
  if (data?.success && data?.data) {
    return data.data as ClientPaymentsPayload;
  }
  if (Array.isArray(data?.payments)) {
    return data as ClientPaymentsPayload;
  }
  throw new Error(data?.message ?? 'Error al obtener pagos');
}

export async function processClientPaymentApi(payload: CreatePaymentInput, token?: string): Promise<ClientPaymentRecord> {
  const config = buildAuthConfig(token);
  const { data } = await api.post('/client/payments/process', payload, config);
  return (data?.data ?? data) as ClientPaymentRecord;
}

// Payment methods

// ==========================
// Client panel - Reports
// ==========================

export async function getAdminClientDetailApi(
  id: string,
  token?: string,
): Promise<AdminClientDetailPayload | null> {
  try {
    const config = token
      ? {
          headers: { Authorization: `Bearer ${token}` },
        }
      : undefined;
    const { data } = await api.get(`/clients/${id}`, config);
    if (data?.success === true && data?.data) {
      return data.data as AdminClientDetailPayload;
    }
    if (data?.client && data?.parameters) {
      return data as AdminClientDetailPayload;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener cliente');
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error('getAdminClientDetailApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Error al obtener el cliente');
    }
    throw error;
  }
}

const normalizeRoleCategoryValue = (value: unknown): RoleCategory | null => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  for (const [category, aliases] of Object.entries(panel_ALIASES)) {
    if (aliases.some(alias => alias.toLowerCase() === normalized)) {
      return category as RoleCategory;
    }
  }
  return null;
};

const withNormalizedRole = <T extends Role>(role: T): T => ({
  ...role,
  panel: normalizeRoleCategoryValue((role as any).panel ?? null),
});

export type Permission = {
  id: string;
  name: string;
  description?: string | null;
  module?: string | null;
};

export type Client = {
  id: string;
  name: string;
};

export type AdminClientsPayload = {
  clients: ClientRecord[];
  parameters: ClientParameter[];
};

export type AdminClientDetailPayload = {
  client: ClientRecord;
  parameters: ClientParameter[];
  serviceCatalog: ServiceCatalogEntry[];
};

type AdminClientInput = {
  name: string;
  status: ClientRecord['status'];
  type: ClientRecord['type'];
  details: ClientDetailValue[];
};

type AdminClientMutationPayload = {
  client: ClientRecord;
};

export type AdminPaymentMutationResult = {
  payment: PaymentRecord;
  methods: PaymentMethod[];
};

export type AdminDashboardSummaryFilters = {
  locale: string;
  months?: number;
  monthsAhead?: number;
  limit?: number;
  from?: string;
  to?: string;
};

export type RegisterUserDto = {
  user: string;
  name: string;
  password: string;
  role_id: string;
  client_id: string;
  status: boolean;
};

export async function getUsersApi(empresaId?: string): Promise<BackendUser[]> {
  const endpoint = empresaId ? `/config/get-users/${empresaId}` : '/config/get-users';
  const { data } = await api.get(endpoint);
  if (!data?.success) {
    throw new Error('No fue posible obtener usuarios');
  }
  return data.data;
}

export async function getUserByIdApi(id: string): Promise<BackendUser> {
  const { data } = await api.get(`/config/users/${id}`);
  if (!data) {
    throw new Error('Usuario no encontrado');
  }
  return data;
}

export async function registerUser(
  dto: RegisterUserDto,
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await api.post('/auth/register', dto);
    return { success: true, data: res.data };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || 'No fue posible crear el usuario',
    };
  }
}

export async function updateUserApi(
  id: string,
  payload: { name?: string; role_id?: string; status?: boolean; password?: string },
): Promise<{ success: boolean; message?: string }> {
  try {
    const { data } = await api.put(`/config/users/${id}`, payload);
    if (!data?.success) {
      throw new Error(data?.message || 'No fue posible actualizar');
    }
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.message || 'No fue posible actualizar el usuario',
    };
  }
}

// Eliminar usuario
export async function deleteUserApi(id: string): Promise<boolean> {
  try {
    const { data } = await api.delete(`/config/users/${id}`);
    if (!data?.success) {
      throw new Error(data?.message || 'No fue posible eliminar el usuario');
    }
    return true;
  } catch (error: any) {
    console.error('deleteUserApi error:', error);
    throw new Error(error?.response?.data?.message || 'No fue posible eliminar el usuario');
  }
}

export async function listRolesApi(): Promise<Role[]> {
  try {
    const { data } = await api.get('/config/roles');
    if (Array.isArray(data)) {
      return data.map(role => withNormalizedRole(role as Role));
    }
    if (data?.success && Array.isArray(data?.data)) {
      return data.data.map((role: Role) => withNormalizedRole(role));
    }
    throw new Error('Formato inesperado en /config/roles');
  } catch (err) {
    const { data } = await api.get('/config/get-roles');
    if (data?.success && Array.isArray(data?.data)) {
      return data.data.map((role: Role) => withNormalizedRole(role));
    }
    if (Array.isArray(data)) {
      return data.map(role => withNormalizedRole(role as Role));
    }
    throw err;
  }
}

export const getRolesApi = listRolesApi;

export async function getRoleApi(id: string): Promise<Role> {
  const { data } = await api.get(`/config/roles/${id}`);
  return withNormalizedRole(data as Role);
}

export async function createRoleApi(payload: {
  name: string;
  description?: string | null;
  status?: boolean;
  panel: RoleCategory;
}): Promise<Role> {
  const { data } = await api.post('/config/roles', payload);
  return withNormalizedRole(data as Role);
}

export async function updateRoleApi(
  id: string,
  payload: {
    name?: string;
    description?: string | null;
    status?: boolean;
    panel?: RoleCategory;
  },
): Promise<Role> {
  const { data } = await api.put(`/config/roles/${id}`, payload);
  return withNormalizedRole(data as Role);
}

export async function deleteRoleApi(id: string): Promise<void> {
  await api.delete(`/config/roles/${id}`);
}

export async function listPermissionsApi(): Promise<Permission[]> {
  const { data } = await api.get('/config/permissions');
  if (!Array.isArray(data)) {
    throw new TypeError('Respuesta inesperada al listar permisos');
  }
  return data as Permission[];
}

export async function getRolePermissionsApi(roleId: string): Promise<string[]> {
  const { data } = await api.get(`/config/roles/${roleId}/permissions`);
  if (!Array.isArray(data)) {
    throw new TypeError('Respuesta inesperada al listar permisos del rol');
  }
  return data as string[];
}

export async function saveRolePermissionsApi(roleId: string, permissionIds: string[]) {
  const { data } = await api.put(`/config/roles/${roleId}/permissions`, { permissionIds });
  return data as { success: boolean };
}

const buildAuthConfig = (token?: string) =>
  token
    ? {
        headers: { Authorization: `Bearer ${token}` },
      }
    : undefined;

export async function getAdminDashboardSummaryApi(
  filters: AdminDashboardSummaryFilters,
  token?: string,
): Promise<AdminDashboardSummary> {
  const { locale, months, monthsAhead, limit, from, to } = filters;

  const params = Object.fromEntries(
    Object.entries({ locale, months, monthsAhead, limit, from, to }).filter(
      ([, value]) => value !== undefined && value !== null,
    ),
  ) as Record<string, string | number>;

  const authConfig = buildAuthConfig(token);
  const headers: Record<string, string> = {
    'Accept-Language': locale,
    ...(authConfig?.headers as Record<string, string> | undefined),
  };

  const toDefaultPeriod = () => {
    const now = new Date();
    const fromD = new Date(now.getFullYear(), now.getMonth(), 1);
    const toD = new Date(fromD.getFullYear(), fromD.getMonth() + 1, 1);
    return { from: fromD.toISOString(), to: toD.toISOString() };
  };

  const normalizeSummary = (raw: any): AdminDashboardSummary => {
    const period = raw?.period ?? toDefaultPeriod();
    const totalsRaw = raw?.totals ?? {};
    const totals = {
      billed: Number(totalsRaw.billed ?? 0),
      pending: Number((totalsRaw.pending ?? totalsRaw.pendiente) ?? 0),
      total: Number(totalsRaw.total ?? ((Number(totalsRaw.billed ?? 0) + Number((totalsRaw.pending ?? totalsRaw.pendiente) ?? 0))))
    };
    const upcomingExpirations = Array.isArray(raw?.upcomingExpirations) ? raw.upcomingExpirations : [];
    const clientStatusRaw = raw?.clientStatus ?? {};
    const clientStatus = {
      total: Number(clientStatusRaw.total ?? 0),
      active: Number(clientStatusRaw.active ?? 0),
      inactive: Number(clientStatusRaw.inactive ?? 0),
      unknown: Number(clientStatusRaw.unknown ?? 0),
    };
    const topServices = Array.isArray(raw?.topServices) ? raw.topServices : [];
    const monthlyComparison = Array.isArray(raw?.monthlyComparison)
      ? raw.monthlyComparison.map((m: any) => ({
          month: String(m.month ?? ''),
          billed: Number(m.billed ?? 0),
          pending: Number((m.pending ?? m.pendiente) ?? 0),
        }))
      : [];

    return { period, totals, upcomingExpirations, clientStatus, topServices, monthlyComparison } as AdminDashboardSummary;
  };

  try {
    const { data } = await api.get('/dashboard/summary', {
      params,
      headers,
    });

    if (data?.success === true && data?.data) {
      return normalizeSummary(data.data);
    }

    if (data && typeof data === 'object' && 'period' in data && 'totals' in data) {
      return normalizeSummary(data);
    }

    // Respuesta inesperada: devolvemos estructura vacía para no romper la UI
    return normalizeSummary(null);
  } catch (error: any) {
    console.error('getAdminDashboardSummaryApi error:', {
      message: error?.message,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    // Degradar con gracia: devolver estructura vacía
    return normalizeSummary(null);
  }
}

export async function getRoleByIdApi(id: string): Promise<Role> {
  const { data } = await api.get(`/config/roles/${id}`);
  return withNormalizedRole(data as Role);
}

export async function getRolePermissionIdsApi(roleId: string) {
  const { data } = await api.get(`/config/roles/${roleId}/permissions`);
  return data as string[];
}

export async function getPermissionsGroupedApi() {
  const { data } = await api.get(`/config/permissions/grouped`);
  return data as Record<string, Permission[]>;
}

export async function createAdminClientApi(
  payload: AdminClientInput,
  token?: string,
): Promise<AdminClientMutationPayload> {
  try {
    const config = buildAuthConfig(token);
    const body = {
      name: payload.name,
      status: payload.status,
      type: payload.type,
      details: payload.details.map(detail => ({
        parameterId: detail.parameterId,
        value: detail.value,
      })),
    };
    const { data } = await api.post('/clients', body, config);
    if (data?.success === true && data?.data?.client) {
      return data.data as AdminClientMutationPayload;
    }
    if (data?.client) {
      return { client: data.client } as AdminClientMutationPayload;
    }
    if (data?.data) {
      return data.data as AdminClientMutationPayload;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al crear el cliente');
  } catch (error: any) {
    console.error('createAdminClientApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible crear el cliente');
    }
    throw error;
  }
}

export async function getAdminClientsListApi(token?: string): Promise<AdminClientsPayload> {
  try {
    const config = token
      ? {
          headers: { Authorization: `Bearer ${token}` },
        }
      : undefined;
    const { data } = await api.get('/clients', config);
    if (data?.success === true && data?.data) {
      return data.data as AdminClientsPayload;
    }
    if (Array.isArray(data?.clients) && Array.isArray(data?.parameters)) {
      return data as AdminClientsPayload;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener clientes');
  } catch (error: any) {
    console.error('getAdminClientsListApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Error al obtener clientes');
    }
    throw error;
  }
}

export async function updateAdminClientApi(
  id: string,
  payload: AdminClientInput,
  token?: string,
): Promise<AdminClientMutationPayload> {
  try {
    const config = buildAuthConfig(token);
    const body = {
      name: payload.name,
      status: payload.status,
      type: payload.type,
      details: payload.details.map(detail => ({
        parameterId: detail.parameterId,
        value: detail.value,
      })),
    };
    const { data } = await api.put(`/clients/${id}`, body, config);
    if (data?.success === true && data?.data?.client) {
      return data.data as AdminClientMutationPayload;
    }
    if (data?.client) {
      return { client: data.client } as AdminClientMutationPayload;
    }
    if (data?.data) {
      return data.data as AdminClientMutationPayload;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al actualizar el cliente');
  } catch (error: any) {
    console.error('updateAdminClientApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar el cliente');
    }
    throw error;
  }
}

export async function deleteAdminClientApi(id: string, token?: string): Promise<void> {
  try {
    const config = buildAuthConfig(token);
    await api.delete(`/clients/${id}`, config);
  } catch (error: any) {
    console.error('deleteAdminClientApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible eliminar el cliente');
    }
    throw error;
  }
}

export async function getAdminPaymentsListApi(token?: string): Promise<PaymentListPayload> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/payments', config);
    if (data?.success === true && data?.data) {
      return data.data as PaymentListPayload;
    }
    if (data?.payments && data?.clients && data?.methods) {
      return data as PaymentListPayload;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener pagos');
  } catch (error: any) {
    console.error('getAdminPaymentsListApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Error al obtener pagos');
    }
    throw error;
  }
}

const mapPaymentPayload = (payload: PaymentFormValues) => ({
  clientId: payload.clientId,
  value: payload.value,
  status: payload.status ?? null,
  reference: payload.reference ?? null,
  methodId: payload.methodId ?? null,
  methodName: payload.methodName ?? null,
  receiptUrl: payload.receiptUrl ?? null,
  type: payload.type ?? null,
  paidAt: payload.paidAt ?? null,
  confirmed: payload.confirmed ?? null,
  attachments: Array.isArray(payload.attachments)
    ? payload.attachments.map(attachment => ({
        id: attachment.id ?? null,
        url: attachment.url,
        invoiceId: attachment.invoiceId ?? null,
      }))
    : [],
});

export async function createAdminPaymentApi(
  payload: PaymentFormValues,
  token?: string,
): Promise<AdminPaymentMutationResult> {
  try {
    const config = buildAuthConfig(token);
    const body = mapPaymentPayload(payload);
    const { data } = await api.post('/payments', body, config);
    if (data?.success === true && data?.data?.payment) {
      return data.data as AdminPaymentMutationResult;
    }
    if (data?.payment && data?.methods) {
      return data as AdminPaymentMutationResult;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al crear el pago');
  } catch (error: any) {
    console.error('createAdminPaymentApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible registrar el pago');
    }
    throw error;
  }
}

export async function updateAdminPaymentApi(
  id: string,
  payload: PaymentFormValues,
  token?: string,
): Promise<AdminPaymentMutationResult> {
  try {
    const config = buildAuthConfig(token);
    const body = mapPaymentPayload(payload);
    const { data } = await api.put(`/payments/${id}`, body, config);
    if (data?.success === true && data?.data?.payment) {
      return data.data as AdminPaymentMutationResult;
    }
    if (data?.payment && data?.methods) {
      return data as AdminPaymentMutationResult;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al actualizar el pago');
  } catch (error: any) {
    console.error('updateAdminPaymentApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar el pago');
    }
    throw error;
  }
}

export async function deleteAdminPaymentApi(id: string, token?: string): Promise<void> {
  try {
    const config = buildAuthConfig(token);
    await api.delete(`/payments/${id}`, config);
  } catch (error: any) {
    console.error('deleteAdminPaymentApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible eliminar el pago');
    }
    throw error;
  }
}

export async function assignClientServiceApi(
  clientId: string,
  payload: AssignServiceInput,
  token?: string,
): Promise<ClientService> {
  try {
    const config = buildAuthConfig(token);
    const body = {
      serviceId: payload.serviceId,
      started: payload.started ?? null,
      delivery: payload.delivery ?? null,
      expiry: payload.expiry ?? null,
      frequency: payload.frequency ?? null,
      unit: payload.unit ?? null,
      urlApi: payload.urlApi ?? null,
      tokenApi: payload.tokenApi ?? null,
      observations: payload.observations ?? null,
    };
    const { data } = await api.post(`/clients/${clientId}/services`, body, config);
    if (data?.success === true && data?.data?.service) {
      return data.data.service as ClientService;
    }
    if (data?.service) {
      return data.service as ClientService;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al asignar el servicio');
  } catch (error: any) {
    console.error('assignClientServiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible asignar el servicio');
    }
    throw error;
  }
}

export async function updateClientServiceApi(
  clientId: string,
  assignmentId: string,
  payload: AssignServiceInput,
  token?: string,
): Promise<ClientService> {
  try {
    const config = buildAuthConfig(token);
    const body = {
      serviceId: payload.serviceId,
      started: payload.started ?? null,
      delivery: payload.delivery ?? null,
      expiry: payload.expiry ?? null,
      frequency: payload.frequency ?? null,
      unit: payload.unit ?? null,
      urlApi: payload.urlApi ?? null,
      tokenApi: payload.tokenApi ?? null,
      observations: payload.observations ?? null,
    };
    const { data } = await api.put(`/clients/${clientId}/services/${assignmentId}`, body, config);
    if (data?.success === true && data?.data?.service) {
      return data.data.service as ClientService;
    }
    if (data?.service) {
      return data.service as ClientService;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al actualizar el servicio del cliente');
  } catch (error: any) {
    console.error('updateClientServiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar el servicio del cliente');
    }
    throw error;
  }
}

export async function getAdminInvoicesApi(
  token?: string,
): Promise<{ invoices: AdminInvoiceListItem[] }> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/invoices', config);
    if (data?.success === true && Array.isArray(data?.data?.invoices)) {
      return { invoices: data.data.invoices as AdminInvoiceListItem[] };
    }
    if (Array.isArray(data?.invoices)) {
      return { invoices: data.invoices as AdminInvoiceListItem[] };
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener facturas');
  } catch (error: any) {
    console.error('getAdminInvoicesApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Error al obtener facturas');
    }
    throw error;
  }
}

export async function getAdminServicesListApi(token?: string): Promise<ServiceListPayload> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/services', config);
    if (data?.success === true && data?.data) {
      const services = Array.isArray(data.data.services) ? (data.data.services as ServiceRecord[]) : [];
      const categories = Array.isArray(data.data.categories) ? (data.data.categories as ServiceCategory[]) : [];
      return { services, categories };
    }
    if (Array.isArray(data?.services) || Array.isArray(data?.categories)) {
      return {
        services: Array.isArray(data?.services) ? (data.services as ServiceRecord[]) : [],
        categories: Array.isArray(data?.categories) ? (data.categories as ServiceCategory[]) : [],
      };
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener servicios');
  } catch (error: any) {
    console.error('getAdminServicesListApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener los servicios');
    }
    throw error;
  }
}

export async function getAdminInvoiceByIdApi(
  id: string,
  token?: string,
): Promise<AdminInvoiceRecord | null> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get(`/invoices/${id}`, config);
    if (data?.success === true && data?.data?.invoice) {
      return data.data.invoice as AdminInvoiceRecord;
    }
    if (data?.invoice) {
      return data.invoice as AdminInvoiceRecord;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener la factura');
  } catch (error: any) {
    console.error('getAdminInvoiceByIdApi error:', error);
  }
}

// ================= Admin Invoice Observations & Comments =================

export async function getAdminInvoiceObservationsApi(invoiceId: string, token?: string): Promise<InvoiceObservation[]> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get(`/invoices/${invoiceId}/observations`, config);
    if (data?.success === true && Array.isArray(data?.data)) {
      return data.data as InvoiceObservation[];
    }
    if (Array.isArray(data)) {
      return data as InvoiceObservation[];
    }
    return [];
  } catch (error: any) {
    console.error('getAdminInvoiceObservationsApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener observaciones');
    }
    throw error;
  }
}

export async function createAdminInvoiceObservationApi(invoiceId: string, content: string, token?: string): Promise<InvoiceObservation> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.post(`/invoices/${invoiceId}/observations`, { content }, config);
    if (data?.success === true && data?.data) {
      return data.data as InvoiceObservation;
    }
    if (data?.id) {
      return data as InvoiceObservation;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al crear observaciÃ³n');
  } catch (error: any) {
    console.error('createAdminInvoiceObservationApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible crear la observaciÃ³n');
    }
    throw error;
  }
}

export async function updateAdminInvoiceObservationApi(observationId: string, content: string, token?: string): Promise<InvoiceObservation> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.put(`/invoices/observations/${observationId}`, { content }, config);
    if (data?.success === true && data?.data) {
      return data.data as InvoiceObservation;
    }
    if (data?.id) {
      return data as InvoiceObservation;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al actualizar observaciÃ³n');
  } catch (error: any) {
    console.error('updateAdminInvoiceObservationApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar la observaciÃ³n');
    }
    throw error;
  }
}

export async function deleteAdminInvoiceObservationApi(observationId: string, token?: string): Promise<void> {
  try {
    const config = buildAuthConfig(token);
    await api.delete(`/invoices/observations/${observationId}`, config);
  } catch (error: any) {
    console.error('deleteAdminInvoiceObservationApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible eliminar la observaciÃ³n');
    }
    throw error;
  }
}

export async function getAdminInvoiceCommentsApi(invoiceId: string, token?: string): Promise<InvoiceComment[]> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get(`/invoices/${invoiceId}/comments`, config);
    if (data?.success === true && Array.isArray(data?.data)) {
      return data.data as InvoiceComment[];
    }
    if (Array.isArray(data)) {
      return data as InvoiceComment[];
    }
    return [];
  } catch (error: any) {
    console.error('getAdminInvoiceCommentsApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener comentarios');
    }
    throw error;
  }
}

export async function getAdminServiceDetailApi(id: string, token?: string): Promise<ServiceDetail | null> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get(`/services/${id}`, config);
    if (data?.success === true && data?.data?.service) {
      return data.data.service as ServiceDetail;
    }
    if (data?.service) {
      return data.service as ServiceDetail;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener el servicio');
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error('getAdminInvoiceByIdApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'Error al obtener la factura');
    }
  }
}

// =============== Service Requests (Admin) ===============

const parseServiceRequestRecord = (payload: any): ServiceRequestRecord => {
  const clientId = payload?.client?.id ?? payload?.client_id ?? null;
  const clientName = payload?.client?.name ?? payload?.client_name ?? 'Sin nombre';
  const serviceId = payload?.service?.id ?? payload?.service_id ?? null;
  const serviceName = payload?.service?.name ?? payload?.service_name ?? 'Servicio';

  const reviewedById = payload?.reviewer?.id ?? payload?.reviewed_by ?? null;
  const reviewedByName = payload?.reviewer?.name ?? payload?.reviewer_name ?? null;

  const createdAt = payload?.created ?? payload?.createdAt ?? payload?.created_at ?? null;
  const updatedAt = payload?.updated ?? payload?.updatedAt ?? payload?.updated_at ?? null;
  const reviewedAt = payload?.reviewed_at ?? payload?.reviewedAt ?? null;

  const statusRaw = String(payload?.status ?? 'pending').toLowerCase();
  const status: ServiceRequestStatus = (() => { if (statusRaw === 'cerrado' || statusRaw === 'closed') return 'cerrado'; if (statusRaw === 'proceso' || statusRaw === 'in_progress' || statusRaw === 'process') return 'proceso'; return 'abierto'; })();

  return {
    id: String(payload?.id ?? payload?._id ?? ''),
    client: { id: String(clientId ?? ''), name: String(clientName ?? 'Sin nombre') },
    service: { id: String(serviceId ?? ''), name: String(serviceName ?? 'Servicio') },
    description: payload?.description ?? null,
    status,
    createdAt: createdAt ? String(createdAt) : new Date().toISOString(),
    updatedAt: updatedAt ? String(updatedAt) : null,
    reviewedBy: reviewedById ? { id: String(reviewedById), name: String(reviewedByName ?? 'Revisor') } : null,
    reviewedAt: reviewedAt ? String(reviewedAt) : null,
    notes: payload?.notes ?? null,
  };
};

export async function getAdminServiceRequestsApi(token?: string): Promise<ServiceRequestRecord[]> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/services/requests', config);
    if (data?.success === true && Array.isArray(data?.data?.requests)) {
      return (data.data.requests as any[]).map(parseServiceRequestRecord);
    }
    if (Array.isArray(data?.requests)) {
      return (data.requests as any[]).map(parseServiceRequestRecord);
    }
    if (Array.isArray(data)) {
      return (data as any[]).map(parseServiceRequestRecord);
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener solicitudes de servicios');
  } catch (error: any) {
    console.error('getAdminServiceRequestsApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener las solicitudes');
    }
    throw error;
  }
}

export async function updateAdminServiceRequestStatusApi(
  id: string,
  status: ServiceRequestStatus,
  notes?: string | null,
  token?: string,
): Promise<ServiceRequestRecord> {
  try {
    const config = buildAuthConfig(token);
    const body: { status: ServiceRequestStatus; notes?: string | null } = { status };
    if (typeof notes !== 'undefined') {
      body.notes = notes;
    }
    const { data } = await api.patch(`/services/requests/${id}`, body, config);
    if (data?.success === true && data?.data?.request) {
      return parseServiceRequestRecord(data.data.request);
    }
    if (data?.request) {
      return parseServiceRequestRecord(data.request);
    }
    if (data && typeof data === 'object') {
      return parseServiceRequestRecord(data);
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al actualizar la solicitud');
  } catch (error: any) {
    console.error('updateAdminServiceRequestStatusApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar el estado');
    }
    throw error;
  }
}

// =============== Client Service Requests ===============

export async function getClientServiceRequestsApi(token?: string): Promise<ServiceRequestRecord[]> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/client/services/requests', config);
    if (data?.success === true && Array.isArray(data?.data?.requests)) {
      return (data.data.requests as any[]).map(parseServiceRequestRecord);
    }
    if (Array.isArray(data?.requests)) {
      return (data.requests as any[]).map(parseServiceRequestRecord);
    }
    if (Array.isArray(data)) {
      return (data as any[]).map(parseServiceRequestRecord);
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener tus solicitudes');
  } catch (error: any) {
    console.error('getClientServiceRequestsApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener tus solicitudes');
    }
    throw error;
  }
}

export async function createClientServiceRequestApi(
  serviceId: string,
  description?: string | null,
  token?: string,
): Promise<ServiceRequestRecord> {
  try {
    const config = buildAuthConfig(token);
    const body = { serviceId, description: description ?? null };
    const { data } = await api.post('/client/services/requests', body, config);
    if (data?.success === true && data?.data?.request) {
      return parseServiceRequestRecord(data.data.request);
    }
    if (data?.request) {
      return parseServiceRequestRecord(data.request);
    }
    if (data && typeof data === 'object') {
      return parseServiceRequestRecord(data);
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al crear la solicitud');
  } catch (error: any) {
    console.error('createClientServiceRequestApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible crear la solicitud');
    }
    throw error;
  }
}

export async function getAdminInvoiceCatalogApi(
  token?: string,
): Promise<AdminInvoiceCatalog> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/invoices/catalog', config);
    if (data?.success === true && data?.data) {
      return data.data as AdminInvoiceCatalog;
    }
    if (Array.isArray(data?.clients) && Array.isArray(data?.services)) {
      return data as AdminInvoiceCatalog;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener el catÃ¡logo de facturas');
  } catch (error: any) {
    console.error('getAdminInvoiceCatalogApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener el catÃ¡logo de facturas');
    }
    throw error;
  }
}

const normalizeInvoiceDetailsPayload = (payload: PersistAdminInvoiceInput['details']) =>
  (Array.isArray(payload) ? payload : []).map((detail, index) => ({
    serviceId: detail.serviceId,
    quantity: detail.quantity,
    total: detail.total,
    item: detail.item ?? index + 1,
  }));

type EncodedInvoiceDocument = {
  name: string;
  type: string | null;
  data: string;
};

const isFileInstance = (value: unknown): value is File =>
  typeof File !== 'undefined' && value instanceof File;

const isEncodedInvoiceDocument = (value: unknown): value is EncodedInvoiceDocument =>
  typeof value === 'object'
  && value !== null
  && typeof (value as EncodedInvoiceDocument).name === 'string'
  && typeof (value as EncodedInvoiceDocument).data === 'string';

const readFileAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
        return;
      }
      reject(new Error('No fue posible leer el archivo adjunto.'));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error('No fue posible leer el archivo adjunto.'));
    };
    reader.readAsDataURL(file);
  });

const normalizeInvoiceDocumentPayload = async (
  fileInput: PersistAdminInvoiceInput['documentFile'],
): Promise<EncodedInvoiceDocument | undefined> => {
  if (!fileInput) {
    return undefined;
  }
  if (isEncodedInvoiceDocument(fileInput)) {
    return fileInput;
  }
  if (isFileInstance(fileInput)) {
    const data = await readFileAsBase64(fileInput);
    return {
      name: fileInput.name,
      type: fileInput.type || null,
      data,
    };
  }
  return undefined;
};

export async function createAdminInvoiceApi(
  payload: PersistAdminInvoiceInput,
  token?: string,
): Promise<AdminInvoiceRecord> {
  try {
    const config = buildAuthConfig(token);
    const documentFile = await normalizeInvoiceDocumentPayload(payload.documentFile);
    const body = {
      clientId: payload.clientId,
      serviceId: payload.serviceId,
      number: payload.number,
      description: payload.description ?? null,
      amount: payload.amount,
      status: payload.status,
      issuedAt: payload.issuedAt ?? null,
      dueAt: payload.dueAt ?? null,
      url: payload.url ?? null,
      details: normalizeInvoiceDetailsPayload(payload.details),
      documentFile,
      subtotal: payload.subtotal,
      taxOne: payload.tax1 ?? null,
      taxTwo: payload.tax2 ?? null,
      includeIva: payload.vatIncluded ?? false,
      vatRate: payload.vatRate ?? null,
    };
    const { data } = await api.post('/invoices', body, config);
    if (data?.success === true && data?.data?.invoice) {
      return data.data.invoice as AdminInvoiceRecord;
    }
    if (data?.invoice) {
      return data.invoice as AdminInvoiceRecord;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al crear la factura');
  } catch (error: any) {
    console.error('createAdminInvoiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible crear la factura');
    }
    throw error;
  }
}

export async function createAdminServiceApi(payload: PersistServiceInput, token?: string): Promise<ServiceRecord> {
  try {
    const config = buildAuthConfig(token);
    const body = {
      name: payload.name,
      description: payload.description ?? null,
      unit: payload.unit ?? null,
      status: payload.status,
      categoryId: payload.categoryId ?? null,
      price: payload.price,
      subtotal: payload.subtotal ?? null,
      frequency: payload.frequency ?? null,
      startDate: payload.startDate ?? null,
      endDate: payload.endDate ?? null,
      taxOneId: payload.taxOneId ?? null,
      taxTwoId: payload.taxTwoId ?? null,
    };
    const { data } = await api.post('/services', body, config);
    if (data?.success === true && data?.data?.service) {
      return data.data.service as ServiceRecord;
    }
    if (data?.service) {
      return data.service as ServiceRecord;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al crear el servicio');
  } catch (error: any) {
    console.error('createAdminServiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible crear el servicio');
    }
    throw error;
  }
}

export async function updateAdminInvoiceApi(
  id: string,
  payload: PersistAdminInvoiceInput,
  token?: string,
): Promise<AdminInvoiceRecord> {
  try {
    const config = buildAuthConfig(token);
    const documentFile = await normalizeInvoiceDocumentPayload(payload.documentFile);
    const body = {
      clientId: payload.clientId,
      serviceId: payload.serviceId,
      number: payload.number,
      description: payload.description ?? null,
      amount: payload.amount,
      status: payload.status,
      issuedAt: payload.issuedAt ?? null,
      dueAt: payload.dueAt ?? null,
      url: payload.url ?? null,
      details: normalizeInvoiceDetailsPayload(payload.details),
      documentFile,
      subtotal: payload.subtotal,
      taxOne: payload.tax1 ?? null,
      taxTwo: payload.tax2 ?? null,
      includeIva: payload.vatIncluded ?? false,
      vatRate: payload.vatRate ?? null,
    };
    const { data } = await api.put(`/invoices/${id}`, body, config);
    if (data?.success === true && data?.data?.invoice) {
      return data.data.invoice as AdminInvoiceRecord;
    }
    if (data?.invoice) {
      return data.invoice as AdminInvoiceRecord;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al actualizar la factura');
  } catch (error: any) {
    console.error('updateAdminInvoiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar la factura');
    }
    throw error;
  }
}

export async function updateAdminServiceApi(
  id: string,
  payload: PersistServiceInput,
  token?: string,
): Promise<ServiceRecord> {
  try {
    const config = buildAuthConfig(token);
    const body = {
      name: payload.name,
      description: payload.description ?? null,
      unit: payload.unit ?? null,
      status: payload.status,
      categoryId: payload.categoryId ?? null,
      price: payload.price,
      subtotal: payload.subtotal ?? null,
      frequency: payload.frequency ?? null,
      startDate: payload.startDate ?? null,
      endDate: payload.endDate ?? null,
      taxOneId: payload.taxOneId ?? null,
      taxTwoId: payload.taxTwoId ?? null,
    };
    const { data } = await api.put(`/services/${id}`, body, config);
    if (data?.success === true && data?.data?.service) {
      return data.data.service as ServiceRecord;
    }
    if (data?.service) {
      return data.service as ServiceRecord;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al actualizar el servicio');
  } catch (error: any) {
    console.error('updateAdminServiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar el servicio');
    }
    throw error;
  }
}

export async function deleteAdminInvoiceApi(id: string, token?: string): Promise<void> {
  try {
    const config = buildAuthConfig(token);
    await api.delete(`/invoices/${id}`, config);
  } catch (error: any) {
    console.error('deleteAdminInvoiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible eliminar la factura');
    }
    throw error;
  }
}

export async function sendAdminInvoiceEmailApi(
  id: string,
  recipient: string,
  token?: string,
): Promise<string> {
  try {
    const config = buildAuthConfig(token);
    const body = { recipient };
    const { data } = await api.post(`/invoices/${id}/send-email`, body, config);
    if (data?.success === true && typeof data?.data?.message === 'string') {
      return data.data.message as string;
    }
    if (typeof data?.message === 'string') {
      return data.message as string;
    }
    if (typeof data?.data === 'string') {
      return data.data as string;
    }
    return 'Correo enviado';
  } catch (error: any) {
    console.error('sendAdminInvoiceEmailApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible enviar la factura');
    }
    throw error;
  }
}

export type AdminInvoiceDownloadFormat = 'pdf' | 'xml' | 'zip';

export async function downloadAdminInvoiceArtifactApi(
  id: string,
  format: AdminInvoiceDownloadFormat,
  token?: string,
): Promise<Blob> {
  try {
    const authConfig = buildAuthConfig(token);
    const config = {
      ...(authConfig ?? {}),
      responseType: 'blob' as const,
    };
    const { data } = await api.get(`/invoices/${id}/download/${format}`, config);
    return data as Blob;
  } catch (error: any) {
    console.error('downloadAdminInvoiceArtifactApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible descargar la factura');
    }
    throw error;
  }
}

// ================= Client Invoices (UI) enhancements =================

export async function deleteClientInvoiceApi(id: string, token?: string): Promise<void> {
  try {
    const config = buildAuthConfig(token);
    await api.delete(`/client/invoices/${id}`, config);
  } catch (error: any) {
    console.error('deleteClientInvoiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible eliminar la factura');
    }
    throw error;
  }
}

export type ClientInvoiceDownloadFormat = 'pdf' | 'xml' | 'zip';
export async function downloadClientInvoiceArtifactApi(id: string, format: ClientInvoiceDownloadFormat, token?: string): Promise<Blob> {
  try {
    const authConfig = buildAuthConfig(token);
    const config = { ...(authConfig ?? {}), responseType: 'blob' as const };
    const { data } = await api.get(`/client/invoices/${id}/download/${format}`, config);
    return data as Blob;
  } catch (error: any) {
    console.error('downloadClientInvoiceArtifactApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible descargar el documento');
    }
    throw error;
  }
}

export async function getClientInvoiceObservationsApi(invoiceId: string, token?: string): Promise<InvoiceObservation[]> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get(`/client/invoices/${invoiceId}/observations`, config);
    if (data?.success === true && Array.isArray(data?.data)) {
      return data.data as InvoiceObservation[];
    }
    if (Array.isArray(data)) {
      return data as InvoiceObservation[];
    }
    return [];
  } catch (error: any) {
    console.error('getClientInvoiceObservationsApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener observaciones');
    }
    throw error;
  }
}

export async function getClientInvoiceCommentsApi(invoiceId: string, token?: string): Promise<InvoiceComment[]> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get(`/client/invoices/${invoiceId}/comments`, config);
    if (data?.success === true && Array.isArray(data?.data)) {
      return data.data as InvoiceComment[];
    }
    if (Array.isArray(data)) {
      return data as InvoiceComment[];
    }
    return [];
  } catch (error: any) {
    console.error('getClientInvoiceCommentsApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener comentarios');
    }
    throw error;
  }
}

export async function createClientInvoiceCommentApi(invoiceId: string, content: string, token?: string): Promise<InvoiceComment> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.post(`/client/invoices/${invoiceId}/comments`, { content }, config);
    if (data?.success === true && data?.data) {
      return data.data as InvoiceComment;
    }
    if (data?.id) {
      return data as InvoiceComment;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al crear comentario');
  } catch (error: any) {
    console.error('createClientInvoiceCommentApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible crear el comentario');
    }
    throw error;
  }
}

export async function updateClientInvoiceCommentApi(commentId: string, content: string, token?: string): Promise<InvoiceComment> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.put(`/client/invoices/comments/${commentId}`, { content }, config);
    if (data?.success === true && data?.data) {
      return data.data as InvoiceComment;
    }
    if (data?.id) {
      return data as InvoiceComment;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al actualizar comentario');
  } catch (error: any) {
    console.error('updateClientInvoiceCommentApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar el comentario');
    }
    throw error;
  }
}

export async function deleteClientInvoiceCommentApi(commentId: string, token?: string): Promise<void> {
  try {
    const config = buildAuthConfig(token);
    await api.delete(`/client/invoices/comments/${commentId}`, config);
  } catch (error: any) {
    console.error('deleteClientInvoiceCommentApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible eliminar el comentario');
    }
    throw error;
  }
}

export async function reportClientInvoicePaymentApi(
  invoiceId: string,
  file: { name: string; data: string; type?: string | null },
  token?: string,
): Promise<{ id: string } | string> {
  try {
    const config = buildAuthConfig(token);
    const body = { documentFile: file };
    const { data } = await api.post(`/client/invoices/${invoiceId}/report-payment`, body, config);
    if (data?.success === true && data?.data) {
      return data.data;
    }
    if (data?.id) {
      return data;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al informar pago');
  } catch (error: any) {
    console.error('reportClientInvoicePaymentApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible informar el pago');
    }
    throw error;
  }
}

export async function deleteAdminServiceApi(id: string, token?: string): Promise<void> {
  try {
    const config = buildAuthConfig(token);
    await api.delete(`/services/${id}`, config);
  } catch (error: any) {
    console.error('deleteAdminServiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible eliminar el servicio');
    }
    throw error;
  }
}

export async function login(credentials: {
  identifier: string;
  password: string;
}): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const response = await api.post('/auth/login', credentials);
    const token: string | undefined = response?.data?.token;

    if (token && typeof window !== 'undefined') {
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      setAuthCookie(token);
    }
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Login error:', error);
    return { success: false, message: error?.response?.data?.message || 'Error al iniciar sesiÃ³n' };
  }
}

export async function logout(): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.post('/auth/logout');
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    delete api.defaults.headers.common.Authorization;
    clearAuthCookie();
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('Logout error:', error);
    return { success: false, message: error?.response?.data?.message || 'Error al cerrar sesiÃ³n' };
  }
}

export async function getAdminQuotesListApi(token?: string): Promise<QuoteSummary[]> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/quotes', config);
    const records = Array.isArray(data)
      ? data
      : data?.success === true && Array.isArray(data?.data)
        ? data.data
        : null;

    if (Array.isArray(records)) {
      return records.map((record: any) => ({
        id: record.id as string,
        reference:
          typeof record.consecutive === 'string' && record.consecutive.trim().length > 0
            ? record.consecutive
            : typeof record.reference === 'string'
              ? record.reference
              : String(record.id ?? ''),
        description: typeof record.description === 'string' ? record.description : null,
        client: {
          id: record.client?.id ?? null,
          name: typeof record.client?.name === 'string' ? record.client.name : 'Cliente sin nombre',
        },
        issuedAt: record.issuedAt ?? null,
        updatedAt: record.updatedAt ?? null,
        status: record.status as QuoteSummary['status'],
        services: Number.isFinite(record.services) ? Number(record.services) : 0,
        amount:
          typeof record.amount === 'number'
            ? record.amount
            : Number.isFinite(Number(record.amount))
              ? Number(record.amount)
              : 0,
        pdfUrl: typeof record.pdfUrl === 'string' ? record.pdfUrl : null,
        invoice: record.invoice
          ? {
              id: record.invoice.id ?? null,
              consecutive: record.invoice.consecutive ?? null,
              number: record.invoice.number ?? null,
              status:
                record.invoice.status === 'aprobada'
                || record.invoice.status === 'rechazada'
                || record.invoice.status === 'pendiente'
                || record.invoice.status === 'en_proceso'
                  ? record.invoice.status
                  : 'pendiente',
              amount:
                typeof record.invoice.amount === 'number'
                  ? record.invoice.amount
                  : Number.isFinite(Number(record.invoice.amount))
                    ? Number(record.invoice.amount)
                    : null,
            }
          : null,
      }));
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener las cotizaciones');
  } catch (error: any) {
    console.error('getAdminQuotesListApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener las cotizaciones');
    }
    throw error;
  }
}

export async function getAdminQuoteDetailApi(
  id: string,
  token?: string,
): Promise<QuoteDetail | null> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get(`/quotes/${id}`, config);
    if (data?.success === true && data?.data) {
      return data.data as QuoteDetail;
    }
    if (data?.id && data?.reference) {
      return data as QuoteDetail;
    }
    return null;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error('getAdminQuoteDetailApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener la cotizaciÃ³n');
    }
    throw error;
  }
}

export async function generateAdminQuotePdfApi(
  id: string,
  token?: string,
): Promise<QuotePdfResult> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.post(`/quotes/${id}/pdf`, {}, config);
    if (data?.success === true && data?.data) {
      return data.data as QuotePdfResult;
    }
    if (data?.id && 'url' in data) {
      return data as QuotePdfResult;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al generar el PDF');
  } catch (error: any) {
    console.error('generateAdminQuotePdfApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible generar el PDF de la cotizaciÃ³n');
    }
    throw error;
  }
}

export async function sendAdminQuoteEmailApi(
  id: string,
  payload: SendQuoteEmailInput,
  token?: string,
): Promise<QuoteEmailResult> {
  try {
    const config = buildAuthConfig(token);
    const body = {
      recipients: payload.recipients,
      message: payload.message ?? null,
    };
    const { data } = await api.post(`/quotes/${id}/email`, body, config);
    if (data?.success === true && data?.data) {
      return data.data as QuoteEmailResult;
    }
    if (data?.id && Array.isArray(data?.recipients)) {
      return data as QuoteEmailResult;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al enviar la cotizaciÃ³n');
  } catch (error: any) {
    console.error('sendAdminQuoteEmailApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible enviar la cotizaciÃ³n por correo');
    }
    throw error;
  }
}

export async function convertAdminQuoteToInvoiceApi(
  id: string,
  token?: string,
): Promise<QuoteInvoiceResult> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.post(`/quotes/${id}/invoice`, {}, config);
    if (data?.success === true && data?.data) {
      return data.data as QuoteInvoiceResult;
    }
    if (data?.invoiceId) {
      return data as QuoteInvoiceResult;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al convertir la cotizaciÃ³n');
  } catch (error: any) {
    console.error('convertAdminQuoteToInvoiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible convertir la cotizaciÃ³n en factura');
    }
    throw error;
  }
}

export async function updateAdminQuoteApi(
  id: string,
  payload: UpdateQuoteInput,
  token?: string,
): Promise<QuoteDetail> {
  try {
    const config = buildAuthConfig(token);
    const body: Record<string, unknown> = {};
    if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
      body.description = payload.description ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
      body.status = payload.status ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'amount')) {
      body.amount = payload.amount ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'url')) {
      body.url = payload.url ?? null;
    }
    const { data } = await api.put(`/quotes/${id}`, body, config);
    if (data?.success === true && data?.data) {
      return data.data as QuoteDetail;
    }
    if (data?.id && data?.reference) {
      return data as QuoteDetail;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al actualizar la cotizaciÃ³n');
  } catch (error: any) {
    console.error('updateAdminQuoteApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar la cotizaciÃ³n');
    }
    throw error;
  }
}

export async function updateAdminQuoteServicesApi(
  id: string,
  services: QuoteServiceInput[],
  token?: string,
): Promise<QuoteDetail> {
  try {
    const config = buildAuthConfig(token);
    const body = {
      services: services.map((service) => {
        const s: Record<string, unknown> = {
          serviceId: service.serviceId,
          quantity: service.quantity,
        };
        if (Object.prototype.hasOwnProperty.call(service, 'unitPrice')) {
          s.unitPrice = service.unitPrice;
        }
        if (Object.prototype.hasOwnProperty.call(service, 'total')) {
          s.total = service.total;
        }
        return s;
      }),
    };
    const { data } = await api.put(`/quotes/${id}/services`, body, config);
    if (data?.success === true && data?.data) {
      return data.data as QuoteDetail;
    }
    if (data?.id && data?.reference) {
      return data as QuoteDetail;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al actualizar los servicios de la cotizaciÃ³n');
  } catch (error: any) {
    console.error('updateAdminQuoteServicesApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar los servicios de la cotizaciÃ³n');
    }
    throw error;
  }
}

export async function createAdminQuoteApi(
  payload: CreateQuoteInput,
  token?: string,
): Promise<QuoteDetail> {
  try {
    const config = buildAuthConfig(token);
    const body: Record<string, unknown> = {
      clientId: payload.clientId,
      description: payload.description ?? null,
      services: payload.services.map((service: QuoteServiceInput) => {
        const servicePayload: Record<string, unknown> = {
          serviceId: service.serviceId,
          quantity: service.quantity,
        };
        if (Object.prototype.hasOwnProperty.call(service, 'unitPrice')) {
          servicePayload.unitPrice = service.unitPrice;
        }
        if (Object.prototype.hasOwnProperty.call(service, 'total')) {
          servicePayload.total = service.total;
        }
        return servicePayload;
      }),
    };
    if (payload.issuedAt) {
      body.issuedAt = payload.issuedAt;
    }

    const { data } = await api.post('/quotes', body, config);
    if (data?.success === true && data?.data) {
      return data.data as QuoteDetail;
    }
    if (data?.id && data?.reference) {
      return data as QuoteDetail;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al crear la cotizaciÃ³n');
  } catch (error: any) {
    console.error('createAdminQuoteApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible crear la cotizaciÃ³n');
    }
    throw error;
  }
}

export async function deleteAdminQuoteApi(id: string, token?: string): Promise<void> {
  try {
    const config = buildAuthConfig(token);
    await api.delete(`/quotes/${id}`, config);
  } catch (error: any) {
    console.error('deleteAdminQuoteApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible eliminar la cotizaciÃ³n');
    }
    throw error;
  }
}

// ============================================================================
// CLIENT SERVICES API
// ============================================================================

export async function getClientServicesApi(token?: string): Promise<ClientServiceSummary[]> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/client/services', config);
    if (data?.success === true && Array.isArray(data?.data?.services)) {
      return data.data.services as ClientServiceSummary[];
    }
    if (Array.isArray(data?.services)) {
      return data.services as ClientServiceSummary[];
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener servicios');
  } catch (error: any) {
    console.error('getClientServicesApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener los servicios');
    }
    throw error;
  }
}

export async function getClientServiceDetailApi(
  id: string,
  token?: string,
  retries = 5,
  backoffMs = 2000,
): Promise<ClientServiceDetail | null> {
  const requestKey = `/client/services/${id}`;

  // Deduplicar solicitudes simultÃ¡neas - si ya hay una pendiente, retornarla
  const existingRequest = pendingRequests.get(requestKey);
  if (existingRequest) {
    console.log(`[Rate Limiter] Reutilizando solicitud pendiente para ${requestKey}`);
    return existingRequest;
  }

  // Verificar lÃ­mite de solicitudes por ventana de tiempo
  const now = Date.now();
  const count = requestCounts.get(requestKey) || 0;
  if (count >= MAX_REQUESTS_PER_WINDOW) {
    const waitTime = RATE_LIMIT_WINDOW;
    console.warn(`[Rate Limiter] LÃ­mite de ${MAX_REQUESTS_PER_WINDOW} solicitudes alcanzado para ${requestKey}. Esperando ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    requestCounts.set(requestKey, 0);
  }

  // Aplicar rate limiting - esperar si la Ãºltima solicitud fue muy reciente
  const lastTime = lastRequestTime.get(requestKey);
  if (lastTime) {
    const timeSinceLastRequest = now - lastTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      console.log(`[Rate Limiter] Esperando ${waitTime}ms antes de solicitar ${requestKey}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  // Incrementar contador de solicitudes
  requestCounts.set(requestKey, count + 1);
  // Limpiar contador despuÃ©s de la ventana de tiempo
  setTimeout(() => {
    const currentCount = requestCounts.get(requestKey) || 0;
    if (currentCount > 0) {
      requestCounts.set(requestKey, currentCount - 1);
    }
  }, RATE_LIMIT_WINDOW);

  // Crear la promesa de la solicitud
  const requestPromise = (async () => {
    try {
      lastRequestTime.set(requestKey, Date.now());
      const config = buildAuthConfig(token);

      const { data } = await api.get(requestKey, config);

      let service: ClientServiceDetail | null = null;
      if (data?.success === true && data?.data?.service) {
        service = data.data.service as ClientServiceDetail;
      } else if (data?.service) {
        service = data.service as ClientServiceDetail;
      }

      // Cargar observaciones si no vinieron en la respuesta principal
      if (service && (!Array.isArray((service as any).observations) || (service as any).observations.length === 0)) {
        try {
          const obsResp = await api.get(`${requestKey}/observations`, config);
          const obs = obsResp?.data?.data ?? obsResp?.data ?? [];
          (service as any).observations = Array.isArray(obs) ? obs : [];
        } catch (e) {
          // no romper si falla; continuar sin observaciones
        }
      }

      return service;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        // Manejar 404 - servicio no encontrado
        if (error.response?.status === 404) {
          return null;
        }

        // Manejar 429 - rate limit excedido
        if (error.response?.status === 429 && retries > 0) {
          console.warn(`[Rate Limiter] 429 detectado, reintentando en ${backoffMs}ms... (intentos restantes: ${retries})`);
          // Limpiar del cachÃ© antes de reintentar
          pendingRequests.delete(requestKey);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          return getClientServiceDetailApi(id, token, retries - 1, backoffMs * 2);
        }

        console.error('getClientServiceDetailApi error:', error);

        // Mensaje especÃ­fico para rate limit
        if (error.response?.status === 429) {
          throw new Error('Demasiadas peticiones. Por favor, espera un momento e intenta nuevamente.');
        }

        throw new Error(error.response?.data?.message ?? 'No fue posible obtener el servicio');
      }
      throw error;
    } finally {
      // Limpiar de la cola de solicitudes pendientes
      pendingRequests.delete(requestKey);
    }
  })();

  // Guardar la solicitud pendiente
  pendingRequests.set(requestKey, requestPromise);

  return requestPromise;
}

// ============================================================================
// CLIENT INVOICES API
// ============================================================================

export async function getClientInvoicesApi(token?: string): Promise<ClientInvoiceSummary[]> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/client/invoices', config);
    if (data?.success === true && Array.isArray(data?.data?.invoices)) {
      return data.data.invoices as ClientInvoiceSummary[];
    }
    if (Array.isArray(data?.invoices)) {
      return data.invoices as ClientInvoiceSummary[];
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener facturas');
  } catch (error: any) {
    console.error('getClientInvoicesApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener las facturas');
    }
    throw error;
  }
}

export async function getClientInvoiceDetailApi(
  id: string,
  token?: string,
): Promise<ClientInvoiceRecord | null> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get(`/client/invoices/${id}`, config);
    if (data?.success === true && data?.data?.invoice) {
      return data.data.invoice as ClientInvoiceRecord;
    }
    if (data?.invoice) {
      return data.invoice as ClientInvoiceRecord;
    }
    return null;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error('getClientInvoiceDetailApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener la factura');
    }
    throw error;
  }
}

// ============================================================================
// CLIENT PAYMENTS API
// ============================================================================

export async function getClientPaymentsApi(token?: string): Promise<ClientPaymentSummary[]> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/client/payments', config);
    if (data?.success === true && Array.isArray(data?.data?.payments)) {
      return data.data.payments as ClientPaymentSummary[];
    }
    if (Array.isArray(data?.payments)) {
      return data.payments as ClientPaymentSummary[];
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener pagos');
  } catch (error: any) {
    console.error('getClientPaymentsApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener los pagos');
    }
    throw error;
  }
}

export async function getClientPaymentDetailApi(
  id: string,
  token?: string,
): Promise<ClientPaymentRecord | null> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get(`/client/payments/${id}`, config);
    if (data?.success === true && data?.data?.payment) {
      return data.data.payment as ClientPaymentRecord;
    }
    if (data?.payment) {
      return data.payment as ClientPaymentRecord;
    }
    return null;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error('getClientPaymentDetailApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener el pago');
    }
    throw error;
  }
}

export async function createClientPaymentApi(
  payload: CreatePaymentInput,
  token?: string,
): Promise<ClientPaymentRecord> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.post('/client/payments/process', payload, config);
    if (data?.success === true && data?.data?.payment) {
      return data.data.payment as ClientPaymentRecord;
    }
    if (data?.payment) {
      return data.payment as ClientPaymentRecord;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al crear el pago');
  } catch (error: any) {
    console.error('createClientPaymentApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible procesar el pago');
    }
    throw error;
  }
}

// ============================================================================
// CLIENT QUOTES API
// ============================================================================

const normalizeClientQuoteStatus = (status: any): ClientQuoteSummary['status'] => {
  if (status === 'aprobada' || status === true) {
    return 'aprobada';
  }
  if (status === 'rechazada' || status === false) {
    return 'rechazada';
  }
  return 'pendiente';
};

const normalizeNumber = (value: any): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizeClientQuoteInvoice = (record: any): ClientQuoteInvoiceSummary | null => {
  const invoice = record?.invoice ?? null;
  if (invoice) {
    return {
      id: invoice.id ?? null,
      number: typeof invoice.number === 'string' ? invoice.number : invoice.id ?? null,
      status:
        invoice.status === 'aprobada'
        || invoice.status === 'rechazada'
        || invoice.status === 'pendiente'
        || invoice.status === 'en_proceso'
          ? invoice.status
          : invoice.status === true
            ? 'aprobada'
            : invoice.status === false
              ? 'rechazada'
              : 'en_proceso',
      amount: invoice.amount != null ? normalizeNumber(invoice.amount) : null,
    };
  }

  const attachments = Array.isArray(record?.quote_attachment) ? record.quote_attachment : [];
  const attachment = attachments.find(att => att && att.invoice_id);
  if (!attachment) {
    return null;
  }

  const attachmentInvoice = attachment.invoice ?? null;
  return {
    id: attachment.invoice_id ?? null,
    number:
      typeof attachmentInvoice?.description === 'string'
        ? attachmentInvoice.description
        : attachment.invoice_id ?? null,
    status:
      attachmentInvoice?.status === true
        ? 'aprobada'
        : attachmentInvoice?.status === false
          ? 'rechazada'
          : 'en_proceso',
    amount: attachmentInvoice ? normalizeNumber(attachmentInvoice.value) : null,
  };
};

export async function getClientQuotesApi(token?: string): Promise<ClientQuoteSummary[]> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/client/quotes', config);
    const records = data?.success === true && Array.isArray(data?.data?.quotes)
      ? data.data.quotes
      : Array.isArray(data?.quotes)
        ? data.quotes
        : null;

    if (Array.isArray(records)) {
      return records.map((record: any) => ({
        id: record.id as string,
        client_id: record.client_id ?? '',
        reference: record.reference ?? record.description ?? null,
        description: record.description ?? null,
        value: normalizeNumber(record.value),
        url: typeof record.url === 'string' ? record.url : null,
        created: record.created ?? null,
        updated: record.updated ?? null,
        status: normalizeClientQuoteStatus(record.status),
        quote_detail: Array.isArray(record.quote_detail)
          ? record.quote_detail.map((detail: any) => ({
              ...detail,
              total_value: normalizeNumber(detail.total_value),
            }))
          : [],
        invoice: normalizeClientQuoteInvoice(record),
      }));
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener cotizaciones');
  } catch (error: any) {
    console.error('getClientQuotesApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener las cotizaciones');
    }
    throw error;
  }
}

export async function getClientQuoteDetailApi(
  id: string,
  token?: string,
): Promise<ClientQuoteRecord | null> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get(`/client/quotes/${id}`, config);
    const record = data?.success === true && data?.data?.quote
      ? data.data.quote
      : data?.quote ?? null;

    if (record) {
      return {
        ...record,
        value: normalizeNumber(record.value),
        status: normalizeClientQuoteStatus(record.status),
        quote_detail: Array.isArray(record.quote_detail)
          ? record.quote_detail.map((detail: any) => ({
              ...detail,
              total_value: normalizeNumber(detail.total_value),
            }))
          : [],
        invoice: normalizeClientQuoteInvoice(record),
      } as ClientQuoteRecord;
    }
    return null;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error('getClientQuoteDetailApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener la cotizaciÃ³n');
    }
    throw error;
  }
}

export async function submitClientQuoteApi(
  payload: CreateClientQuoteInput,
  token?: string,
): Promise<ClientQuoteRecord> {
  try {
    const config = buildAuthConfig(token);
    const body: Record<string, unknown> = {
      description: payload.description ?? null,
      services: payload.services.map((service) => {
        const entry: Record<string, unknown> = {
          serviceId: service.serviceId,
          quantity: service.quantity,
        };
        if (Object.prototype.hasOwnProperty.call(service, 'unitPrice')) {
          entry.unitPrice = service.unitPrice;
        }
        if (Object.prototype.hasOwnProperty.call(service, 'total')) {
          entry.total = service.total;
        }
        return entry;
      }),
    };

    const { data } = await api.post('/client/quotes', body, config);
    if (data?.success === true && data?.data?.quote) {
      return data.data.quote as ClientQuoteRecord;
    }
    if (data?.quote) {
      return data.quote as ClientQuoteRecord;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al enviar la cotizaciÃ³n');
  } catch (error: any) {
    console.error('submitClientQuoteApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible enviar la cotizaciÃ³n');
    }
    throw error;
  }
}

export async function updateClientQuoteApi(
  id: string,
  payload: CreateClientQuoteInput,
  token?: string,
): Promise<ClientQuoteRecord> {
  try {
    const config = buildAuthConfig(token);
    const body: Record<string, unknown> = {
      description: payload.description ?? null,
      services: payload.services.map((service) => {
        const entry: Record<string, unknown> = {
          serviceId: service.serviceId,
          quantity: service.quantity,
        };
        if (Object.prototype.hasOwnProperty.call(service, 'unitPrice')) {
          entry.unitPrice = service.unitPrice;
        }
        if (Object.prototype.hasOwnProperty.call(service, 'total')) {
          entry.total = service.total;
        }
        return entry;
      }),
    };

    const { data } = await api.put(`/client/quotes/${id}`, body, config);
    if (data?.success === true && data?.data?.quote) {
      return data.data.quote as ClientQuoteRecord;
    }
    if (data?.quote) {
      return data.quote as ClientQuoteRecord;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al actualizar la cotizaciÃ³n');
  } catch (error: any) {
    console.error('updateClientQuoteApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar la cotizaciÃ³n');
    }
    throw error;
  }
}

export async function deleteClientQuoteApi(id: string, token?: string): Promise<void> {
  try {
    const config = buildAuthConfig(token);
    await api.delete(`/client/quotes/${id}`, config);
  } catch (error: any) {
    console.error('deleteClientQuoteApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible eliminar la cotizaciÃ³n');
    }
    throw error;
  }
}

export async function generateInvoiceFromQuoteApi(
  id: string,
  token?: string,
): Promise<GenerateInvoiceResult> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.post(`/client/quotes/${id}/generate-invoice`, {}, config);
    if (data?.success === true && data?.data) {
      return data.data as GenerateInvoiceResult;
    }
    if (data?.invoiceId) {
      return data as GenerateInvoiceResult;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al generar la factura');
  } catch (error: any) {
    console.error('generateInvoiceFromQuoteApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible generar la factura');
    }
    throw error;
  }
}

// ============================================================================
// CLIENT PAYMENT METHODS API
// ============================================================================

export async function getClientPaymentMethodsApi(token?: string): Promise<PaymentMethodSummary[]> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/client/payment-methods', config);
    if (data?.success === true && Array.isArray(data?.data?.methods)) {
      return data.data.methods as PaymentMethodSummary[];
    }
    if (Array.isArray(data?.methods)) {
      return data.methods as PaymentMethodSummary[];
    }
    if (Array.isArray(data)) {
      return data as PaymentMethodSummary[];
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener mÃ©todos de pago');
  } catch (error: any) {
    console.error('getClientPaymentMethodsApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener los mÃ©todos de pago');
    }
    throw error;
  }
}

export async function getClientPaymentMethodByIdApi(
  id: string,
  token?: string,
): Promise<PaymentMethodSummary | null> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get(`/client/payment-methods/${id}`, config);
    if (data?.success === true && data?.data?.method) {
      return data.data.method as PaymentMethodSummary;
    }
    if (data?.method) {
      return data.method as PaymentMethodSummary;
    }
    if (data?.id && data?.name) {
      return data as PaymentMethodSummary;
    }
    return null;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error('getClientPaymentMethodByIdApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener el mÃ©todo de pago');
    }
    throw error;
  }
}

// ============================================================================
// CLIENT DASHBOARD API
// ============================================================================

export async function getClientDashboardApi(token?: string): Promise<ClientDashboardData> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/client/dashboard/summary', config);
    if (data?.success === true && data?.data) {
      return data.data as ClientDashboardData;
    }
    if (data?.balance && data?.serviceConsumption && data?.expirations) {
      return data as ClientDashboardData;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener datos del dashboard');
  } catch (error: any) {
    console.error('getClientDashboardApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener los datos del dashboard');
    }
    throw error;
  }
}

// ============================================================================
// CLIENT REPORTS API
// ============================================================================

export async function getClientFinancialSummaryApi(token?: string): Promise<FinancialSummary> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/client/reports/financial-summary', config);
    if (data?.success === true && data?.data) {
      return data.data as FinancialSummary;
    }
    if (data?.summary && data?.generatedAt) {
      return data as FinancialSummary;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener el resumen financiero');
  } catch (error: any) {
    console.error('getClientFinancialSummaryApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener el resumen financiero');
    }
    throw error;
  }
}

export async function getClientInvoicesReportApi(
  startDate?: string,
  endDate?: string,
  token?: string,
): Promise<InvoicesReport> {
  try {
    const config = buildAuthConfig(token);
    const params = Object.fromEntries(
      Object.entries({ startDate, endDate }).filter(([, value]) => value !== undefined),
    ) as Record<string, string>;
    const { data } = await api.get('/client/reports/invoices', { ...config, params });
    if (data?.success === true && data?.data) {
      return data.data as InvoicesReport;
    }
    if (data?.period && data?.invoices && data?.totals) {
      return data as InvoicesReport;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener el reporte de facturas');
  } catch (error: any) {
    console.error('getClientInvoicesReportApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener el reporte de facturas');
    }
    throw error;
  }
}

export async function getClientPaymentsReportApi(
  startDate?: string,
  endDate?: string,
  token?: string,
): Promise<PaymentsReport> {
  try {
    const config = buildAuthConfig(token);
    const params = Object.fromEntries(
      Object.entries({ startDate, endDate }).filter(([, value]) => value !== undefined),
    ) as Record<string, string>;
    const { data } = await api.get('/client/reports/payments', { ...config, params });
    if (data?.success === true && data?.data) {
      return data.data as PaymentsReport;
    }
    if (data?.period && data?.payments && data?.totals) {
      return data as PaymentsReport;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener el reporte de pagos');
  } catch (error: any) {
    console.error('getClientPaymentsReportApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener el reporte de pagos');
    }
    throw error;
  }
}

export async function getClientServicesStatusReportApi(token?: string): Promise<ServicesStatusReport> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get('/client/reports/services-status', config);
    if (data?.success === true && data?.data) {
      return data.data as ServicesStatusReport;
    }
    if (data?.summary && data?.services) {
      return data as ServicesStatusReport;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener el reporte de servicios');
  } catch (error: any) {
    console.error('getClientServicesStatusReportApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener el reporte de servicios');
    }
    throw error;
  }
}

export async function getClientAccountStatementApi(
  startDate?: string,
  endDate?: string,
  token?: string,
): Promise<AccountStatement> {
  try {
    const config = buildAuthConfig(token);
    const params = Object.fromEntries(
      Object.entries({ startDate, endDate }).filter(([, value]) => value !== undefined),
    ) as Record<string, string>;
    const { data } = await api.get('/client/reports/account-statement', { ...config, params });
    if (data?.success === true && data?.data) {
      return data.data as AccountStatement;
    }
    if (data?.period && data?.transactions && data?.summary) {
      return data as AccountStatement;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener el estado de cuenta');
  } catch (error: any) {
    console.error('getClientAccountStatementApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener el estado de cuenta');
    }
    throw error;
  }
}

// ============================================================================
// CLIENT QUOTE COMMENTS API
// ============================================================================

export type QuoteComment = {
  id: string;
  quoteId: string;
  userId: string | null;
  content: string;
  created: string | null;
  updated: string | null;
  status: boolean | null;
};

export async function getClientQuoteCommentsApi(quoteId: string, token?: string): Promise<QuoteComment[]> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get(`/client/quotes/${quoteId}/comments`, config);
    if (data?.success === true && Array.isArray(data?.data)) {
      return data.data as QuoteComment[];
    }
    if (Array.isArray(data)) {
      return data as QuoteComment[];
    }
    return [];
  } catch (error: any) {
    console.error('getClientQuoteCommentsApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener los comentarios');
    }
    throw error;
  }
}

export async function createClientQuoteCommentApi(
  quoteId: string,
  content: string,
  token?: string,
): Promise<QuoteComment> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.post(`/client/quotes/${quoteId}/comments`, { content }, config);
    if (data?.success === true && data?.data) {
      return data.data as QuoteComment;
    }
    if (data?.id) {
      return data as QuoteComment;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al crear el comentario');
  } catch (error: any) {
    console.error('createClientQuoteCommentApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible crear el comentario');
    }
    throw error;
  }
}

export async function updateClientQuoteCommentApi(
  commentId: string,
  content: string,
  token?: string,
): Promise<QuoteComment> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.put(`/client/quotes/comments/${commentId}`, { content }, config);
    if (data?.success === true && data?.data) {
      return data.data as QuoteComment;
    }
    if (data?.id) {
      return data as QuoteComment;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al actualizar el comentario');
  } catch (error: any) {
    console.error('updateClientQuoteCommentApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar el comentario');
    }
    throw error;
  }
}

export async function deleteClientQuoteCommentApi(commentId: string, token?: string): Promise<void> {
  try {
    const config = buildAuthConfig(token);
    await api.delete(`/client/quotes/comments/${commentId}`, config);
  } catch (error: any) {
    console.error('deleteClientQuoteCommentApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible eliminar el comentario');
    }
    throw error;
  }
}

export async function approveClientQuoteApi(quoteId: string, token?: string): Promise<{ id: string; status: string; updated: string | null }> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.post(`/client/quotes/${quoteId}/approve`, {}, config);
    if (data?.success === true && data?.data) {
      return data.data;
    }
    if (data?.id) {
      return data;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al aprobar la cotizaciÃ³n');
  } catch (error: any) {
    console.error('approveClientQuoteApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible aprobar la cotizaciÃ³n');
    }
    throw error;
  }
}

// ============================================================================
// ADMIN QUOTE OBSERVATIONS API
// ============================================================================

export type QuoteObservation = {
  id: string;
  quoteId: string;
  userId: string | null;
  content: string;
  created: string | null;
  updated: string | null;
  status: boolean | null;
};

export async function getAdminQuoteObservationsApi(quoteId: string, token?: string): Promise<QuoteObservation[]> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get(`/quotes/${quoteId}/observations`, config);
    if (data?.success === true && Array.isArray(data?.data)) {
      return data.data as QuoteObservation[];
    }
    if (Array.isArray(data)) {
      return data as QuoteObservation[];
    }
    return [];
  } catch (error: any) {
    console.error('getAdminQuoteObservationsApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener las observaciones');
    }
    throw error;
  }
}

export async function createAdminQuoteObservationApi(
  quoteId: string,
  content: string,
  token?: string,
): Promise<QuoteObservation> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.post(`/quotes/${quoteId}/observations`, { content }, config);
    if (data?.success === true && data?.data) {
      return data.data as QuoteObservation;
    }
    if (data?.id) {
      return data as QuoteObservation;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al crear la observaciÃ³n');
  } catch (error: any) {
    console.error('createAdminQuoteObservationApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible crear la observaciÃ³n');
    }
    throw error;
  }
}

export async function updateAdminQuoteObservationApi(
  observationId: string,
  content: string,
  token?: string,
): Promise<QuoteObservation> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.put(`/quotes/observations/${observationId}`, { content }, config);
    if (data?.success === true && data?.data) {
      return data.data as QuoteObservation;
    }
    if (data?.id) {
      return data as QuoteObservation;
    }
    throw new Error(data?.message ?? 'Respuesta inesperada al actualizar la observaciÃ³n');
  } catch (error: any) {
    console.error('updateAdminQuoteObservationApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar la observaciÃ³n');
    }
    throw error;
  }
}

export async function deleteAdminQuoteObservationApi(observationId: string, token?: string): Promise<void> {
  try {
    const config = buildAuthConfig(token);
    await api.delete(`/quotes/observations/${observationId}`, config);
  } catch (error: any) {
    console.error('deleteAdminQuoteObservationApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible eliminar la observaciÃ³n');
    }
    throw error;
  }
}
