import { api } from '@shared/services/conexion';

export type CompanyProfile = {
  // Datos de empresa
  name: string; // Nombre
  legal_name?: string; // Razón social
  tax_id?: string; // NIT/CC
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  status: boolean;
  // Contacto administrativo
  admin_contact?: {
    name?: string;
    role?: string;
    phone?: string;
    mobile?: string;
    email?: string;
  };
  // Cargo contable
  accounting_contact?: {
    name?: string;
    role?: string;
    phone?: string;
    mobile?: string;
    email?: string;
  };
  updated?: string | null;
};

const STORAGE_KEY = 'client_company_profile';

export async function getCompanyProfileApi(_clientId?: string): Promise<CompanyProfile | null> {
  try {
    // Intento de API (si el backend lo soporta). Tolerante: si falla, usa storage local.
    const { data } = await api.get('/client/company/profile');
    if (data && typeof data === 'object') {
      // El backend devuelve { success: true, data: {...} }
      const anyData = (data as any).data || data;
      if (anyData && ('name' in anyData || 'status' in anyData)) {
        const profile: CompanyProfile = {
          name: String(anyData.name ?? ''),
          legal_name: anyData.legal_name ?? anyData.razon_social ?? '',
          tax_id: anyData.tax_id ?? anyData.nit ?? anyData.cc ?? '',
          phone: anyData.phone ?? '',
          mobile: anyData.mobile ?? anyData.celular ?? '',
          email: anyData.email ?? '',
          website: anyData.website ?? anyData.web ?? '',
          address: anyData.address ?? anyData.direccion ?? '',
          city: anyData.city ?? '',
          status: Boolean(anyData.status ?? true),
          admin_contact: anyData.admin_contact ?? {
            name: anyData.admin_name ?? '',
            role: anyData.admin_role ?? '',
            phone: anyData.admin_phone ?? '',
            mobile: anyData.admin_mobile ?? '',
            email: anyData.admin_email ?? '',
          },
          accounting_contact: anyData.accounting_contact ?? {
            name: anyData.accounting_name ?? '',
            role: anyData.accounting_role ?? '',
            phone: anyData.accounting_phone ?? '',
            mobile: anyData.accounting_mobile ?? '',
            email: anyData.accounting_email ?? '',
          },
        };
        return profile;
      }
    }
  } catch {
    // noop: fallback a storage
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as CompanyProfile;
      }
    } catch {
      // ignore parse errors
    }
  }
  return { name: '', status: true };
}

export async function saveCompanyProfileApi(
  _clientId: string | null | undefined,
  payload: CompanyProfile,
): Promise<CompanyProfile> {
  try {
    const { data } = await api.put('/client/company/profile', payload);
    if (data && typeof data === 'object') {
      // El backend devuelve { success: true, data: {...} }
      const anyData = (data as any).data || data;
      const updated: CompanyProfile = {
        name: String(anyData.name ?? payload.name ?? ''),
        legal_name: anyData.legal_name ?? payload.legal_name ?? '',
        tax_id: anyData.tax_id ?? payload.tax_id ?? '',
        phone: anyData.phone ?? payload.phone ?? '',
        mobile: anyData.mobile ?? payload.mobile ?? '',
        email: anyData.email ?? payload.email ?? '',
        website: anyData.website ?? payload.website ?? '',
        address: anyData.address ?? payload.address ?? '',
        city: anyData.city ?? payload.city ?? '',
        status: Boolean(anyData.status ?? payload.status ?? true),
        admin_contact: anyData.admin_contact ?? payload.admin_contact ?? {},
        accounting_contact: anyData.accounting_contact ?? payload.accounting_contact ?? {},
        updated: anyData.updated ?? new Date().toISOString(),
      };
      return updated;
    }
  } catch {
    // fallback: persist en storage local
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // ignore
      }
    }
  }
  return { ...payload, updated: new Date().toISOString() };
}

// ==============================
// Alert rules (admin settings)
// ==============================
export type AlertRule = {
  id: string;
  name: string;
  type: string;
  channels: string[];
  remind_before_minutes?: number[] | null;
  conditions?: unknown;
  is_active?: boolean;
  description?: string | null;
  active?: boolean; // legacy
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type AlertRulePayload = {
  id?: string;
  name: string;
  type: string;
  channels: string[];
  remind_before_minutes?: number[] | null;
  conditions?: unknown;
  is_active?: boolean;
  description?: string | null;
  active?: boolean; // legacy
};

export async function listAlertRulesApi(): Promise<AlertRule[]> {
  try {
    const { data } = await api.get('/settings/alerts');
    if (Array.isArray(data)) {
      return data as AlertRule[];
    }
    if (Array.isArray((data as any)?.data)) {
      return (data as any).data as AlertRule[];
    }
  } catch {
    // ignore
  }
  return [];
}

export async function saveAlertRuleApi(payload: AlertRulePayload): Promise<AlertRule> {
  if (payload.id) {
    const { data } = await api.put(`/settings/alerts/${payload.id}`, payload);
    return (data?.data ?? data) as AlertRule;
  }
  const { data } = await api.post('/settings/alerts', payload);
  return (data?.data ?? data) as AlertRule;
}

export async function deleteAlertRuleApi(id: string): Promise<void> {
  await api.delete(`/settings/alerts/${id}`);
}

// ==============================
// General settings
// ==============================
export type GeneralSettingPayload = {
  id?: string;
  company_timezone?: string;
  company_locale?: string;
  currency?: string;
  first_day_of_week?: number | null;
  number_decimals?: number | null;
  date_format?: string;
  time_format?: string;
  branding_primary_color?: string;
  logo_url?: string;
  updated?: string | null;
} & Record<string, unknown>;

export async function getGeneralSettingApi(): Promise<GeneralSettingPayload> {
  try {
    const { data } = await api.get('/settings/general');
    return (data?.data ?? data ?? {}) as GeneralSettingPayload;
  } catch {
    return {};
  }
}

export async function saveGeneralSettingApi(payload: GeneralSettingPayload): Promise<GeneralSettingPayload> {
  try {
    const { data } = await api.put('/settings/general', payload);
    return (data?.data ?? data ?? payload) as GeneralSettingPayload;
  } catch {
    return payload;
  }
}

// ==============================
// Security policy
// ==============================
export type SecurityPolicyPayload = {
  id?: string;
  require_2fa_all?: boolean;
  require_2fa_admin?: boolean;
  allowed_2fa_methods?: string[];
  allowed_ips?: string[];
  max_concurrent_sessions?: number | null;
};

export async function getSecurityPolicyApi(): Promise<SecurityPolicyPayload> {
  try {
    const { data } = await api.get('/settings/security/policy');
    return (data?.data ?? data ?? {}) as SecurityPolicyPayload;
  } catch {
    return {};
  }
}

export async function saveSecurityPolicyApi(payload: SecurityPolicyPayload): Promise<SecurityPolicyPayload> {
  try {
    const { data } = await api.put('/settings/security/policy', payload);
    return (data?.data ?? data ?? payload) as SecurityPolicyPayload;
  } catch {
    return payload;
  }
}

// ==============================
// Password policy
// ==============================
export type PasswordPolicyPayload = {
  id?: string;
  // snake_case keys used in UI
  min_length?: number | null;
  require_uppercase?: boolean;
  require_lowercase?: boolean;
  require_number?: boolean;
  require_special?: boolean;
  disallow_common_passwords?: boolean;
  expire_days?: number | null;
  history_last_n?: number | null;
};

export async function getPasswordPolicyApi(): Promise<PasswordPolicyPayload> {
  try {
    const { data } = await api.get('/settings/security/password-policy');
    return (data?.data ?? data ?? {}) as PasswordPolicyPayload;
  } catch {
    return {};
  }
}

export async function savePasswordPolicyApi(payload: PasswordPolicyPayload): Promise<PasswordPolicyPayload> {
  try {
    const { data } = await api.put('/settings/security/password-policy', payload);
    return (data?.data ?? data ?? payload) as PasswordPolicyPayload;
  } catch {
    return payload;
  }
}

// ==============================
// Session policy
// ==============================
export type SessionPolicyPayload = {
  id?: string;
  idle_timeout_minutes?: number | null;
  absolute_session_minutes?: number | null;
  remember_me_days?: number | null;
  lock_after_failed_attempts?: number | null;
  lock_window_minutes?: number | null;
  lock_duration_minutes?: number | null;
};

export async function getSessionPolicyApi(): Promise<SessionPolicyPayload> {
  try {
    const { data } = await api.get('/settings/security/session-policy');
    return (data?.data ?? data ?? {}) as SessionPolicyPayload;
  } catch {
    return {};
  }
}

export async function saveSessionPolicyApi(payload: SessionPolicyPayload): Promise<SessionPolicyPayload> {
  try {
    const { data } = await api.put('/settings/security/session-policy', payload);
    return (data?.data ?? data ?? payload) as SessionPolicyPayload;
  } catch {
    return payload;
  }
}

// ==============================
// SMTP Config
// ==============================
export type SmtpConfigPayload = {
  id?: string;
  host?: string;
  port?: number | string;
  secure?: boolean;
  username?: string;
  password_encrypted?: string;
  from_name?: string;
  from_email?: string;
  reply_to_email?: string;
  rate_limit_per_minute?: number | null | string;
};

export async function getSmtpConfigApi(): Promise<SmtpConfigPayload> {
  try {
    const { data } = await api.get('/settings/smtp');
    return (data?.data ?? data ?? {}) as SmtpConfigPayload;
  } catch {
    return {};
  }
}

export async function saveSmtpConfigApi(payload: SmtpConfigPayload): Promise<SmtpConfigPayload> {
  try {
    const { data } = await api.put('/settings/smtp', payload);
    return (data?.data ?? data ?? payload) as SmtpConfigPayload;
  } catch {
    return payload;
  }
}
