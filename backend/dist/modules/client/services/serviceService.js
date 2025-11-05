import { prisma } from '../../../config/db.js';
const toIso = (value) => (value ? value.toISOString() : null);
const normalizeText = (value, fallback) => {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : fallback;
};
const decimalToNumberOrNull = (value) => {
    if (value === null || typeof value === 'undefined')
        return null;
    if (typeof value === 'number')
        return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    if (typeof value === 'object' && typeof value?.toString === 'function') {
        const parsed = Number.parseFloat(value.toString());
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
};
const mapStatus = (status) => (status === false ? 'inactive' : 'active');
const mapTax = (tax) => {
    if (!tax)
        return null;
    const percentage = decimalToNumberOrNull(tax.percentage) ?? 0;
    return {
        id: tax.id,
        name: normalizeText(tax.name ?? null, 'Impuesto sin nombre'),
        percentage,
    };
};
const mapCategory = (category) => {
    if (!category)
        return null;
    return {
        id: category.id,
        name: normalizeText(category.name ?? null, 'Sin categorÃ­a'),
    };
};
const mapServiceUsage = (usage) => ({
    id: usage.id,
    startDate: toIso(usage.start_date),
    endDate: toIso(usage.end_date),
    usage: usage.usage ?? null,
    status: usage.status ?? null,
    createdAt: toIso(usage.created),
});
const mapClientServiceSummary = (assignment) => {
    const service = assignment.service;
    const toIsoObs = (d) => (d instanceof Date ? d.toISOString() : d ? new Date(d).toISOString() : null);
    const observations = Array.isArray(assignment.service_observation)
        ? assignment.service_observation.map((o) => ({
            id: o.id,
            content: o.content,
            created: toIsoObs(o.created),
            updated: toIsoObs(o.updated),
        }))
        : [];
    return {
        id: assignment.id,
        serviceId: service?.id ?? '',
        name: normalizeText(service?.name ?? null, 'Servicio sin nombre'),
        description: service?.description ?? null,
        unit: assignment.unit ?? service?.unit ?? null,
        price: decimalToNumberOrNull(service?.price ?? null),
        frequency: assignment.frequency ?? service?.frequency ?? null,
        category: mapCategory(service?.service_category ?? null),
        started: toIso(assignment.started),
        delivery: toIso(assignment.delivery),
        expiry: toIso(assignment.expiry),
        status: mapStatus(service?.status ?? null),
        observations,
    };
};
const mapClientServiceDetail = (assignment) => {
    const service = assignment.service;
    return {
        id: assignment.id,
        serviceId: service?.id ?? '',
        name: normalizeText(service?.name ?? null, 'Servicio sin nombre'),
        description: service?.description ?? null,
        unit: assignment.unit ?? service?.unit ?? null,
        price: decimalToNumberOrNull(service?.price ?? null),
        subtotal: decimalToNumberOrNull(service?.subtotal ?? null) ?? decimalToNumberOrNull(service?.price ?? null),
        frequency: assignment.frequency ?? service?.frequency ?? null,
        category: mapCategory(service?.service_category ?? null),
        taxOne: mapTax(service?.tax_service_tax_one_idTotax ?? null),
        taxTwo: mapTax(service?.tax_service_tax_two_idTotax ?? null),
        started: toIso(assignment.started),
        delivery: toIso(assignment.delivery),
        expiry: toIso(assignment.expiry),
        urlApi: assignment.url_api ?? null,
        tokenApi: assignment.token_api ?? null,
        status: mapStatus(service?.status ?? null),
        usage: Array.isArray(service?.service_usage) ? service.service_usage.map(mapServiceUsage) : [],
    };
};
const isUuid = (value) => {
    if (typeof value !== 'string')
        return false;
    const v = value.trim();
    // Basic UUID v4/v1 pattern check (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v);
};
export async function listClientServices(clientId) {
    const assignments = await prisma.client_service.findMany({
        where: { client_id: clientId },
        include: {
            service: {
                include: {
                    service_category: true,
                },
            },
            service_observation: {
                where: { status: { not: false } },
                orderBy: { created: 'desc' },
            },
        },
        orderBy: { created: 'desc' },
    });
    return assignments.map(mapClientServiceSummary);
}
export async function fetchClientServiceById(clientId, serviceId) {
    // Validaciones defensivas para evitar P2023 (UUID inválido)
    if (!isUuid(clientId) || !isUuid(serviceId)) {
        return null;
    }
    const assignment = await prisma.client_service.findFirst({
        where: {
            client_id: clientId,
            service_id: serviceId,
        },
        include: {
            service: {
                include: {
                    service_category: true,
                    tax_service_tax_one_idTotax: true,
                    tax_service_tax_two_idTotax: true,
                    service_usage: {
                        where: { client_id: clientId },
                        orderBy: { created: 'desc' },
                    },
                },
            },
            service_observation: {
                where: { status: { not: false } },
                orderBy: { created: 'desc' },
            },
        },
    });
    if (!assignment)
        return null;
    const base = mapClientServiceDetail(assignment);
    const toIsoObs = (d) => (d instanceof Date ? d.toISOString() : d ? new Date(d).toISOString() : null);
    const observations = Array.isArray(assignment.service_observation)
        ? assignment.service_observation.map((o) => ({ id: o.id, content: o.content, created: toIsoObs(o.created), updated: toIsoObs(o.updated) }))
        : [];
    return { ...base, observations };
}
