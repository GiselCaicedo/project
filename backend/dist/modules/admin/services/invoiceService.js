import { randomUUID } from 'node:crypto';
import { prisma } from '../../../config/db.js';
const toIso = (value) => {
    if (!value)
        return null;
    const date = value instanceof Date ? value : new Date(value);
    const time = date.getTime();
    return Number.isFinite(time) ? new Date(time).toISOString() : null;
};
const parseCurrency = (value) => {
    if (typeof value === 'number')
        return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
        const normalized = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
        const parsed = Number.parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
};
const formatCurrencyString = (value) => value.toFixed(2);
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
const roundCurrency = (value) => {
    if (!Number.isFinite(value))
        return 0;
    return Number.parseFloat(value.toFixed(2));
};
const buildTaxLine = (tax, amount, fallbackId, fallbackName) => {
    const normalizedAmount = roundCurrency(amount);
    if (!tax) {
        if (normalizedAmount === 0)
            return null;
        return {
            id: fallbackId,
            name: fallbackName,
            percentage: 0,
            amount: normalizedAmount,
        };
    }
    return {
        id: tax.id,
        name: normalizeText(tax.name ?? null, fallbackName),
        percentage: decimalToNumberOrNull(tax.percentage) ?? 0,
        amount: normalizedAmount,
    };
};
const mapStatus = (invoice) => {
    if (invoice.status === true)
        return 'paid';
    if (invoice.status === false)
        return 'cancelled';
    const due = invoice.expiry ?? invoice.updated ?? invoice.created ?? null;
    if (due) {
        const dueDate = new Date(due);
        if (Number.isFinite(dueDate.getTime()) && dueDate.getTime() < Date.now()) {
            return 'overdue';
        }
    }
    return 'pending';
};
const mapInvoiceDetail = (detail, index) => ({
    id: detail.id,
    item: detail.item ?? index + 1,
    quantity: detail.quantity ?? 0,
    total: parseCurrency(detail.total_value),
    serviceId: detail.service_id ?? null,
    serviceName: detail.service?.name ?? 'Servicio sin nombre',
    unit: detail.service?.unit ?? null,
});
const mapAttachments = (invoice) => {
    const baseLabel = invoice.description ?? `Factura ${invoice.id}`;
    return [
        { id: `${invoice.id}-pdf`, type: 'pdf', label: `${baseLabel}.pdf` },
        { id: `${invoice.id}-xml`, type: 'xml', label: `${baseLabel}.xml` },
        { id: `${invoice.id}-zip`, type: 'zip', label: `${baseLabel}.zip` },
    ];
};
const mapInvoiceRecord = (invoice) => {
    const details = Array.isArray(invoice.invoice_detail) ? invoice.invoice_detail : [];
    const serviceId = invoice.service?.id ?? invoice.service_id ?? null;
    const fallbackServiceName = details[0]?.service?.name ?? 'Servicio sin nombre';
    const serviceName = invoice.service
        ? normalizeText(invoice.service.name ?? null, 'Servicio sin nombre')
        : normalizeText(fallbackServiceName ?? null, 'Servicio sin nombre');
    const subtotal = decimalToNumberOrNull(invoice.subtotal) ?? parseCurrency(invoice.value);
    const taxOneAmount = decimalToNumberOrNull(invoice.tax_one) ?? 0;
    const taxTwoAmount = decimalToNumberOrNull(invoice.tax_two) ?? 0;
    const includeIva = invoice.include_iva === true;
    const storedTotal = decimalToNumberOrNull(invoice.total);
    const ivaAmount = includeIva ? roundCurrency(subtotal * 0.19) : 0;
    const computedTotal = roundCurrency(subtotal + taxOneAmount + taxTwoAmount + ivaAmount);
    const total = storedTotal ?? computedTotal;
    const amount = total;
    const taxOne = buildTaxLine(invoice.service?.tax_one ?? null, taxOneAmount, 'tax-one', 'Impuesto 1');
    const taxTwo = buildTaxLine(invoice.service?.tax_two ?? null, taxTwoAmount, 'tax-two', 'Impuesto 2');
    const vatRate = includeIva ? 0.19 : null;
    return {
        id: invoice.id,
        number: invoice.description ?? invoice.id,
        description: invoice.description ?? invoice.id,
        clientId: invoice.client?.id ?? invoice.client_id ?? null,
        clientName: invoice.client?.name ?? 'Cliente sin nombre',
        serviceId,
        serviceName,
        subtotal,
        taxOne,
        taxTwo,
        includeIva,
        ivaAmount,
        total,
        amount,
        tax1: taxOneAmount,
        tax2: taxTwoAmount,
        vatIncluded: includeIva,
        vatRate,
        issuedAt: toIso(invoice.created),
        dueAt: toIso(invoice.expiry),
        status: mapStatus(invoice),
        url: invoice.url ?? null,
        createdAt: toIso(invoice.created),
        updatedAt: toIso(invoice.updated),
        details: details.map((detail, index) => mapInvoiceDetail(detail, index)),
        attachments: mapAttachments(invoice),
    };
};
const mapInvoiceListItem = (invoice) => {
    const record = mapInvoiceRecord(invoice);
    return {
        id: record.id,
        number: record.number,
        clientId: record.clientId,
        clientName: record.clientName,
        serviceId: record.serviceId,
        serviceName: record.serviceName,
        subtotal: record.subtotal,
        taxOne: record.taxOne,
        taxTwo: record.taxTwo,
        includeIva: record.includeIva,
        ivaAmount: record.ivaAmount,
        total: record.total,
        amount: record.amount,
        issuedAt: record.issuedAt,
        dueAt: record.dueAt,
        status: record.status,
        services: record.details.length,
    };
};
const normalizeDetailInput = (input, index) => {
    const quantity = Number.isFinite(Number(input.quantity)) ? Number(input.quantity) : 0;
    const total = Number.isFinite(Number(input.total)) ? Number(input.total) : 0;
    const item = Number.isFinite(Number(input.item)) ? Number(input.item) : index + 1;
    return {
        serviceId: input.serviceId,
        quantity,
        total,
        item,
    };
};
const mapStatusFlag = (status) => {
    if (status === 'paid')
        return true;
    if (status === 'cancelled')
        return false;
    return null;
};
const parseDate = (value) => {
    if (!value)
        return null;
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
};
const IVA_RATE = 0.19;
async function calculateInvoiceTotals(input) {
    const service = await prisma.service.findUnique({
        where: { id: input.serviceId },
        include: { tax_one: true, tax_two: true },
    });
    if (!service) {
        throw new Error('SERVICE_NOT_FOUND');
    }
    const baseSubtotal = decimalToNumberOrNull(service.subtotal) ?? decimalToNumberOrNull(service.price) ?? 0;
    const subtotal = roundCurrency(typeof input.subtotalOverride === 'number' && Number.isFinite(input.subtotalOverride)
        ? input.subtotalOverride
        : baseSubtotal);
    const taxOnePercentage = decimalToNumberOrNull(service.tax_one?.percentage ?? null) ?? 0;
    const taxTwoPercentage = decimalToNumberOrNull(service.tax_two?.percentage ?? null) ?? 0;
    const computedTaxOne = roundCurrency(subtotal * (taxOnePercentage / 100));
    const computedTaxTwo = roundCurrency(subtotal * (taxTwoPercentage / 100));
    const taxOneAmount = roundCurrency(typeof input.taxOneOverride === 'number' && Number.isFinite(input.taxOneOverride)
        ? input.taxOneOverride
        : computedTaxOne);
    const taxTwoAmount = roundCurrency(typeof input.taxTwoOverride === 'number' && Number.isFinite(input.taxTwoOverride)
        ? input.taxTwoOverride
        : computedTaxTwo);
    const ivaAmount = input.includeIva ? roundCurrency(subtotal * IVA_RATE) : 0;
    const total = roundCurrency(subtotal + taxOneAmount + taxTwoAmount + ivaAmount);
    return { subtotal, taxOneAmount, taxTwoAmount, ivaAmount, total, service };
}
export async function fetchInvoices() {
    const invoices = await prisma.invoice.findMany({
        include: {
            client: { select: { id: true, name: true } },
            service: { include: { tax_one: true, tax_two: true } },
            invoice_detail: {
                include: {
                    service: { select: { id: true, name: true, unit: true } },
                },
                orderBy: { item: 'asc' },
            },
        },
        orderBy: { created: 'desc' },
    });
    return invoices.map((invoice) => mapInvoiceListItem(invoice));
}
export async function fetchInvoiceById(id) {
    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
            client: { select: { id: true, name: true } },
            service: { include: { tax_one: true, tax_two: true } },
            invoice_detail: {
                include: {
                    service: { select: { id: true, name: true, unit: true } },
                },
                orderBy: { item: 'asc' },
            },
        },
    });
    if (!invoice)
        return null;
    return mapInvoiceRecord(invoice);
}
export async function fetchInvoiceCatalog() {
    const [clients, services] = await Promise.all([
        prisma.client.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        }),
        prisma.service.findMany({
            include: { tax_one: true, tax_two: true },
            orderBy: { name: 'asc' },
        }),
    ]);
    return {
        clients: clients.map((client) => ({
            id: client.id,
            name: client.name?.trim() && client.name.trim().length > 0 ? client.name.trim() : 'Cliente sin nombre',
        })),
        services: services.map((service) => ({
            id: service.id,
            name: service.name?.trim() && service.name.trim().length > 0 ? service.name.trim() : 'Servicio sin nombre',
            unit: service.unit ?? null,
            price: decimalToNumberOrNull(service.price) ?? null,
            subtotal: decimalToNumberOrNull(service.subtotal) ?? decimalToNumberOrNull(service.price) ?? null,
            taxOne: buildTaxLine(service.tax_one ?? null, 0, 'tax-one', 'Impuesto 1'),
            taxTwo: buildTaxLine(service.tax_two ?? null, 0, 'tax-two', 'Impuesto 2'),
        })),
    };
}
const buildDetailCreateInput = (details, fallbackServiceId, fallbackTotal) => {
    if (Array.isArray(details) && details.length > 0) {
        const normalized = details
            .map((detail, index) => normalizeDetailInput(detail, index))
            .filter((detail) => detail.serviceId);
        if (normalized.length > 0) {
            return {
                createMany: {
                    data: normalized.map((detail) => ({
                        id: randomUUID(),
                        service_id: detail.serviceId,
                        quantity: detail.quantity,
                        total_value: detail.total,
                        item: detail.item,
                        status: true,
                    })),
                },
            };
        }
    }
    if (!fallbackServiceId)
        return undefined;
    return {
        createMany: {
            data: [
                {
                    id: randomUUID(),
                    service_id: fallbackServiceId,
                    quantity: 1,
                    total_value: fallbackTotal,
                    item: 1,
                    status: true,
                },
            ],
        },
    };
};
export async function createInvoice(payload) {
    const includeIva = payload.includeIva ?? false;
    const totals = await calculateInvoiceTotals({
        serviceId: payload.serviceId,
        includeIva,
        subtotalOverride: payload.subtotal,
        taxOneOverride: payload.taxOne,
        taxTwoOverride: payload.taxTwo,
    });
    const invoice = await prisma.invoice.create({
        data: {
            id: randomUUID(),
            client_id: payload.clientId,
            service_id: payload.serviceId,
            description: payload.number,
            value: formatCurrencyString(totals.total),
            subtotal: formatCurrencyString(totals.subtotal),
            tax_one: formatCurrencyString(totals.taxOneAmount),
            tax_two: formatCurrencyString(totals.taxTwoAmount),
            total: formatCurrencyString(totals.total),
            include_iva: includeIva,
            url: payload.url ?? null,
            created: parseDate(payload.issuedAt) ?? new Date(),
            updated: new Date(),
            expiry: parseDate(payload.dueAt),
            status: mapStatusFlag(payload.status),
            invoice_detail: buildDetailCreateInput(payload.details, payload.serviceId, totals.total),
        },
        include: {
            client: { select: { id: true, name: true } },
            service: { include: { tax_one: true, tax_two: true } },
            invoice_detail: {
                include: { service: { select: { id: true, name: true, unit: true } } },
                orderBy: { item: 'asc' },
            },
        },
    });
    return mapInvoiceRecord(invoice);
}
export async function updateInvoice(id, payload) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice)
        return null;
    const includeIva = typeof payload.includeIva === 'boolean' ? payload.includeIva : invoice.include_iva ?? false;
    const totals = await calculateInvoiceTotals({
        serviceId: payload.serviceId,
        includeIva,
        subtotalOverride: payload.subtotal,
        taxOneOverride: payload.taxOne,
        taxTwoOverride: payload.taxTwo,
    });
    await prisma.invoice.update({
        where: { id },
        data: {
            client_id: payload.clientId,
            service_id: payload.serviceId,
            description: payload.number,
            value: formatCurrencyString(totals.total),
            subtotal: formatCurrencyString(totals.subtotal),
            tax_one: formatCurrencyString(totals.taxOneAmount),
            tax_two: formatCurrencyString(totals.taxTwoAmount),
            total: formatCurrencyString(totals.total),
            include_iva: includeIva,
            url: payload.url ?? null,
            expiry: parseDate(payload.dueAt),
            status: mapStatusFlag(payload.status),
            updated: new Date(),
            created: parseDate(payload.issuedAt) ?? invoice.created,
        },
    });
    await prisma.invoice_detail.deleteMany({ where: { invoice_id: id } });
    const detailInput = buildDetailCreateInput(payload.details, payload.serviceId, totals.total);
    if (detailInput) {
        await prisma.invoice.update({
            where: { id },
            data: {
                invoice_detail: detailInput,
            },
        });
    }
    return fetchInvoiceById(id);
}
export async function deleteInvoice(id) {
    await prisma.invoice_detail.deleteMany({ where: { invoice_id: id } });
    await prisma.payment_attachment.deleteMany({ where: { invoice_id: id } });
    await prisma.quote_attachment.deleteMany({ where: { invoice_id: id } });
    await prisma.invoice.delete({ where: { id } });
}
export async function sendInvoiceEmail(id, recipient) {
    const invoice = await fetchInvoiceById(id);
    if (!invoice) {
        throw new Error('Factura no encontrada');
    }
    const address = recipient.trim();
    if (!address) {
        throw new Error('Destinatario inválido');
    }
    return {
        message: `Factura ${invoice.number} enviada a ${address}`,
    };
}
const buildArtifactContent = (invoice, format) => {
    const baseName = invoice.number.replace(/[^a-zA-Z0-9-_]+/g, '_') || `invoice-${invoice.id}`;
    const extension = format;
    const filename = `${baseName}.${extension}`;
    const description = `Factura ${invoice.number}\nCliente: ${invoice.clientName}\nTotal: ${invoice.amount.toFixed(2)}\nEmitida: ${invoice.issuedAt ?? 'N/D'}\nVence: ${invoice.dueAt ?? 'N/D'}`;
    let contentType = 'application/octet-stream';
    if (format === 'pdf')
        contentType = 'application/pdf';
    if (format === 'xml')
        contentType = 'application/xml';
    if (format === 'zip')
        contentType = 'application/zip';
    const content = Buffer.from(description, 'utf-8');
    return { filename, contentType, content };
};
export async function generateInvoiceArtifact(id, format) {
    const invoice = await fetchInvoiceById(id);
    if (!invoice) {
        throw new Error('Factura no encontrada');
    }
    return buildArtifactContent(invoice, format);
}
