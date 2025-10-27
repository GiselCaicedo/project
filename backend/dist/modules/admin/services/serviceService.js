import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/db.js';
export class ServiceHasAssignmentsError extends Error {
    constructor(message = 'El servicio tiene clientes asignados') {
        super(message);
        this.name = 'ServiceHasAssignmentsError';
    }
}
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
const decimalOrNull = (value) => {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return null;
    return new Prisma.Decimal(value.toFixed(2));
};
const roundCurrency = (value) => {
    if (!Number.isFinite(value))
        return 0;
    return Number.parseFloat(value.toFixed(2));
};
const mapStatus = (status) => (status === false ? 'inactive' : 'active');
const mapStatusToBoolean = (status) => status === 'active';
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
        name: normalizeText(category.name ?? null, 'Sin categoría'),
    };
};
const mapServiceRecord = (service) => ({
    id: service.id,
    name: normalizeText(service.name ?? null, 'Servicio sin nombre'),
    description: service.description ?? null,
    unit: service.unit ?? null,
    price: decimalToNumberOrNull(service.price ?? null),
    subtotal: decimalToNumberOrNull(service.subtotal ?? null) ?? decimalToNumberOrNull(service.price ?? null),
    frequency: service.frequency ?? null,
    startDate: toIso(service.start_date),
    endDate: toIso(service.end_date),
    taxOne: mapTax(service.tax_one ?? null),
    taxTwo: mapTax(service.tax_two ?? null),
    status: mapStatus(service.status ?? null),
    category: mapCategory(service.service_category ?? null),
    createdAt: toIso(service.created),
    updatedAt: toIso(service.updated),
    clientsCount: service._count?.client_service ?? service.clientsCount ?? 0,
});
const mapClientAssignment = (assignment) => ({
    id: assignment.id,
    clientId: assignment.client_id ?? '',
    clientName: normalizeText(assignment.client?.name ?? null, 'Cliente sin nombre'),
    started: toIso(assignment.started),
    delivery: toIso(assignment.delivery),
    expiry: toIso(assignment.expiry),
    frequency: assignment.frequency ?? null,
    unit: assignment.unit ?? assignment.service?.unit ?? null,
    urlApi: assignment.url_api ?? null,
    tokenApi: assignment.token_api ?? null,
});
export async function listServices() {
    const services = await prisma.service.findMany({
        include: {
            service_category: true,
            tax_one: true,
            tax_two: true,
            _count: { select: { client_service: true } },
        },
        orderBy: [{ name: 'asc' }],
    });
    return services.map(mapServiceRecord);
}
export async function fetchServiceCategories() {
    const categories = await prisma.service_category.findMany({
        orderBy: [{ name: 'asc' }],
    });
    return categories.map((category) => ({
        id: category.id,
        name: normalizeText(category.name ?? null, 'Categoría sin nombre'),
    }));
}
export async function fetchServiceById(id) {
    const service = await prisma.service.findUnique({
        where: { id },
        include: {
            service_category: true,
            tax_one: true,
            tax_two: true,
            client_service: {
                include: {
                    client: { select: { id: true, name: true } },
                    service: { select: { unit: true } },
                },
                orderBy: { created: 'desc' },
            },
            _count: { select: { client_service: true } },
        },
    });
    if (!service)
        return null;
    const base = mapServiceRecord(service);
    const clients = Array.isArray(service.client_service)
        ? service.client_service.map(mapClientAssignment)
        : [];
    return { ...base, clients };
}
export async function createService(payload) {
    const now = new Date();
    const subtotalValue = payload.subtotal ?? payload.price ?? null;
    const priceDecimal = decimalOrNull(payload.price);
    const subtotalDecimal = decimalOrNull(subtotalValue);
    const service = await prisma.service.create({
        data: {
            id: randomUUID(),
            name: payload.name.trim(),
            description: payload.description?.trim() ?? null,
            unit: payload.unit?.trim() ?? null,
            status: mapStatusToBoolean(payload.status),
            service_category_id: payload.categoryId?.trim() || null,
            price: priceDecimal,
            subtotal: subtotalDecimal,
            frequency: payload.frequency ?? null,
            start_date: payload.startDate ?? null,
            end_date: payload.endDate ?? null,
            tax_one_id: payload.taxOneId ?? null,
            tax_two_id: payload.taxTwoId ?? null,
            created: now,
            updated: now,
        },
        include: {
            service_category: true,
            tax_one: true,
            tax_two: true,
            _count: { select: { client_service: true } },
        },
    });
    return mapServiceRecord(service);
}
export async function updateService(id, payload) {
    try {
        const subtotalValue = payload.subtotal ?? payload.price ?? null;
        const priceDecimal = decimalOrNull(payload.price);
        const subtotalDecimal = decimalOrNull(subtotalValue);
        const service = await prisma.service.update({
            where: { id },
            data: {
                name: payload.name.trim(),
                description: payload.description?.trim() ?? null,
                unit: payload.unit?.trim() ?? null,
                status: mapStatusToBoolean(payload.status),
                service_category_id: payload.categoryId?.trim() || null,
                price: priceDecimal,
                subtotal: subtotalDecimal,
                frequency: payload.frequency ?? null,
                start_date: payload.startDate ?? null,
                end_date: payload.endDate ?? null,
                tax_one_id: payload.taxOneId ?? null,
                tax_two_id: payload.taxTwoId ?? null,
                updated: new Date(),
            },
            include: {
                service_category: true,
                tax_one: true,
                tax_two: true,
                _count: { select: { client_service: true } },
            },
        });
        await recalculateInvoicesForService(id);
        return mapServiceRecord(service);
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return null;
        }
        throw error;
    }
}
async function recalculateInvoicesForService(serviceId) {
    const service = await prisma.service.findUnique({
        where: { id: serviceId },
        include: { tax_one: true, tax_two: true },
    });
    if (!service)
        return;
    const subtotal = decimalToNumberOrNull(service.subtotal ?? null) ?? decimalToNumberOrNull(service.price ?? null) ?? 0;
    const taxOnePercentage = decimalToNumberOrNull(service.tax_one?.percentage ?? null) ?? 0;
    const taxTwoPercentage = decimalToNumberOrNull(service.tax_two?.percentage ?? null) ?? 0;
    const invoices = await prisma.invoice.findMany({
        where: { service_id: serviceId },
        select: { id: true, include_iva: true },
    });
    if (invoices.length === 0)
        return;
    const taxOneAmount = roundCurrency(subtotal * (taxOnePercentage / 100));
    const taxTwoAmount = roundCurrency(subtotal * (taxTwoPercentage / 100));
    for (const invoice of invoices) {
        const includeIva = invoice.include_iva ?? false;
        const ivaAmount = includeIva ? roundCurrency(subtotal * 0.19) : 0;
        const total = roundCurrency(subtotal + taxOneAmount + taxTwoAmount + ivaAmount);
        await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
                subtotal: decimalOrNull(subtotal),
                tax_one: decimalOrNull(taxOneAmount),
                tax_two: decimalOrNull(taxTwoAmount),
                total: decimalOrNull(total),
                value: total.toFixed(2),
                updated: new Date(),
            },
        });
        await prisma.invoice_detail.updateMany({
            where: { invoice_id: invoice.id },
            data: { total_value: total },
        });
    }
}
export async function deleteService(id) {
    await prisma.$transaction(async (tx) => {
        const assignments = await tx.client_service.count({ where: { service_id: id } });
        if (assignments > 0) {
            throw new ServiceHasAssignmentsError();
        }
        const invoicesCount = await tx.invoice.count({ where: { service_id: id } });
        if (invoicesCount > 0) {
            throw new ServiceHasAssignmentsError('El servicio tiene facturas asociadas');
        }
        try {
            await tx.service.delete({ where: { id } });
        }
        catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                throw new Error('SERVICE_NOT_FOUND');
            }
            throw error;
        }
    });
}
