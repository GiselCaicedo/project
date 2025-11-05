export const PANEL_ROLE_CATEGORIES = ['admin', 'client'];
const PANEL_CATEGORY_ALIASES = {
    admin: ['admin', 'panel_admin'],
    client: ['client', 'cliente', 'panel_client'],
};
export const normalizeRoleCategory = (raw) => {
    const value = (raw ?? '').trim().toLowerCase();
    if (!value) {
        throw new Error('Categoría de rol inválida. Debe ser "admin" o "client".');
    }
    for (const category of PANEL_ROLE_CATEGORIES) {
        if (PANEL_CATEGORY_ALIASES[category].some((alias) => alias.toLowerCase() === value)) {
            return category.toUpperCase();
        }
    }
    if (PANEL_ROLE_CATEGORIES.includes(value)) {
        return value.toUpperCase();
    }
    throw new Error('Categoría de rol inválida. Debe ser "admin" o "client".');
};
export const safeNormalizeRoleCategory = (raw) => {
    if (!raw)
        return null;
    // Si ya es un RoleCategory válido, lo retornamos en minúsculas para compatibilidad
    if (raw === 'ADMIN')
        return 'admin';
    if (raw === 'CLIENT')
        return 'client';
    // Si es un string, intentamos normalizarlo
    try {
        const normalized = normalizeRoleCategory(raw);
        return normalized.toLowerCase();
    }
    catch {
        return null;
    }
};
