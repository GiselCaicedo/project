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
import type { PersistTaxInput, TaxRecord } from '@admin/settings/taxes/types';
import type {
  PaymentFormValues,
  PaymentListPayload,
  PaymentMethod,
  PaymentRecord,
} from '@admin/payments/types';
import type {
  QuoteDetail,
  QuoteEmailResult,
  QuoteInvoiceResult,
  QuotePdfResult,
  QuoteSummary,
  SendQuoteEmailInput,
  CreateQuoteInput,
  QuoteServiceInput,
  UpdateQuoteInput,
} from '@admin/quotes/types';
import type {
  PersistServiceInput,
  ServiceCategory,
  ServiceDetail,
  ServiceListPayload,
  ServiceRecord,
} from '@admin/services/types';
import type {
  ClientServiceSummary,
  ClientServiceDetail,
} from '@client/services/types';
import type {
  ClientInvoiceSummary,
  ClientInvoiceRecord,
} from '@client/invoices/types';
import type {
  ClientPaymentSummary,
  ClientPaymentRecord,
  CreatePaymentInput,
  PaymentMethodSummary,
} from '@client/payments/types';
import type {
  ClientQuoteSummary,
  ClientQuoteRecord,
  ClientQuoteInvoiceSummary,
  CreateClientQuoteInput,
  GenerateInvoiceResult,
} from '@client/quotes/types';
import type {
  FinancialSummary,
  InvoicesReport,
  PaymentsReport,
  ServicesStatusReport,
  AccountStatement,
} from '@client/reports/types';
import axios, { type AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const TOKEN_STORAGE_KEY = 'auth_token';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

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

// Status 401 (sesión expirada)
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

// ==========================
// Client panel - Services
// ==========================
import type {
  ClientServicesPayload,
  ClientServiceDetail,
} from '@app/modules/client/services/types';
import type {
  ClientQuotesPayload,
  ClientQuoteRecord,
  GenerateInvoiceResult,
} from '@app/modules/client/quotes/types';
import type {
  ClientInvoicesPayload,
  ClientInvoiceRecord,
} from '@app/modules/client/invoices/types';
import type {
  ClientPaymentsPayload,
  ClientPaymentRecord,
  ClientPaymentMethodsPayload,
  CreatePaymentInput,
} from '@app/modules/client/payments/types';
import type {
  FinancialSummary,
  InvoicesReport,
  PaymentsReport,
  ServicesStatusReport,
  AccountStatement,
} from '@app/modules/client/reports/types';

export async function getClientServicesListApi(token?: string): Promise<ClientServicesPayload> {
  const config = buildAuthConfig(token);
  const { data } = await api.get('/client/services', config);
  if (data?.success && data?.data) return data.data as ClientServicesPayload;
  if (Array.isArray(data?.services)) return data as ClientServicesPayload;
  throw new Error(data?.message ?? 'Error al obtener servicios');
}



// ==========================
// Client panel - Quotes
// ==========================
export async function getClientQuotesListApi(token?: string): Promise<ClientQuotesPayload> {
  const config = buildAuthConfig(token);
  const { data } = await api.get('/client/quotes', config);
  if (data?.success && data?.data) return data.data as ClientQuotesPayload;
  if (Array.isArray(data?.quotes)) return data as ClientQuotesPayload;
  throw new Error(data?.message ?? 'Error al obtener cotizaciones');
}




// ==========================
// Client panel - Invoices
// ==========================
export async function getClientInvoicesListApi(token?: string): Promise<ClientInvoicesPayload> {
  const config = buildAuthConfig(token);
  const { data } = await api.get('/client/invoices', config);
  if (data?.success && data?.data) return data.data as ClientInvoicesPayload;
  if (Array.isArray(data?.invoices)) return data as ClientInvoicesPayload;
  throw new Error(data?.message ?? 'Error al obtener facturas');
}


// ==========================
// Client panel - Payments
// ==========================
export async function getClientPaymentsListApi(token?: string): Promise<ClientPaymentsPayload> {
  const config = buildAuthConfig(token);
  const { data } = await api.get('/client/payments', config);
  if (data?.success && data?.data) return data.data as ClientPaymentsPayload;
  if (Array.isArray(data?.payments)) return data as ClientPaymentsPayload;
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

  try {
    const { data } = await api.get('/dashboard/summary', {
      params,
      headers,
    });

    if (data?.success === true && data?.data) {
      return data.data as AdminDashboardSummary;
    }

    if (data && typeof data === 'object' && 'period' in data && 'totals' in data) {
      return data as AdminDashboardSummary;
    }

    throw new Error(data?.message ?? 'No fue posible obtener el resumen del dashboard');
  } catch (error: any) {
    console.error('getAdminDashboardSummaryApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ?? 'No fue posible obtener el resumen del dashboard',
      );
    }
    throw error;
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
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener el catálogo de facturas');
  } catch (error: any) {
    console.error('getAdminInvoiceCatalogApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener el catálogo de facturas');
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
    return { success: false, message: error?.response?.data?.message || 'Error al iniciar sesión' };
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
    return { success: false, message: error?.response?.data?.message || 'Error al cerrar sesión' };
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
        reference: typeof record.reference === 'string' ? record.reference : String(record.id ?? ''),
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
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener la cotización');
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
      throw new Error(error.response?.data?.message ?? 'No fue posible generar el PDF de la cotización');
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
    throw new Error(data?.message ?? 'Respuesta inesperada al enviar la cotización');
  } catch (error: any) {
    console.error('sendAdminQuoteEmailApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible enviar la cotización por correo');
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
    throw new Error(data?.message ?? 'Respuesta inesperada al convertir la cotización');
  } catch (error: any) {
    console.error('convertAdminQuoteToInvoiceApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible convertir la cotización en factura');
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
    throw new Error(data?.message ?? 'Respuesta inesperada al actualizar la cotización');
  } catch (error: any) {
    console.error('updateAdminQuoteApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible actualizar la cotización');
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
    throw new Error(data?.message ?? 'Respuesta inesperada al crear la cotización');
  } catch (error: any) {
    console.error('createAdminQuoteApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible crear la cotización');
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
      throw new Error(error.response?.data?.message ?? 'No fue posible eliminar la cotización');
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
): Promise<ClientServiceDetail | null> {
  try {
    const config = buildAuthConfig(token);
    const { data } = await api.get(`/client/services/${id}`, config);
    if (data?.success === true && data?.data?.service) {
      return data.data.service as ClientServiceDetail;
    }
    if (data?.service) {
      return data.service as ClientServiceDetail;
    }
    return null;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error('getClientServiceDetailApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener el servicio');
    }
    throw error;
  }
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
  if (status === 'aprobada' || status === true) return 'aprobada';
  if (status === 'rechazada' || status === false) return 'rechazada';
  return 'pendiente';
};

const normalizeNumber = (value: any): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
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
        quote_detail: Array.isArray(record.quote_detail) ? record.quote_detail.map((detail: any) => ({
          ...detail,
          total_value: normalizeNumber(detail.total_value),
        })) : [],
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
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener la cotización');
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
      services: payload.services.map(service => {
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
    throw new Error(data?.message ?? 'Respuesta inesperada al enviar la cotización');
  } catch (error: any) {
    console.error('submitClientQuoteApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible enviar la cotización');
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
    throw new Error(data?.message ?? 'Respuesta inesperada al obtener métodos de pago');
  } catch (error: any) {
    console.error('getClientPaymentMethodsApi error:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener los métodos de pago');
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
      throw new Error(error.response?.data?.message ?? 'No fue posible obtener el método de pago');
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
