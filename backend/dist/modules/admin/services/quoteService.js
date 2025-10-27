import { randomUUID } from 'node:crypto';
import { prisma } from '../../../config/db.js';
const normalizeText = (value, fallback) => {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : fallback;
    }
    return fallback;
};
const toIso = (value) => {
    if (!value)
        return null;
    if (value instanceof Date) {
        return value.toISOString();
    }
    const asDate = new Date(value);
    return Number.isNaN(asDate.getTime()) ? null : asDate.toISOString();
};
const toNumber = (value) => {
    if (value === null || value === undefined)
        return 0;
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    if (typeof value === 'bigint') {
        return Number(value);
    }
    if (typeof value === 'object') {
        if (typeof value.toNumber === 'function') {
            try {
                const parsed = value.toNumber();
                return Number.isFinite(parsed) ? parsed : 0;
            }
            catch {
                return 0;
            }
        }
        if (typeof value.valueOf === 'function') {
            const parsed = Number(value.valueOf());
            return Number.isFinite(parsed) ? parsed : 0;
        }
    }
    return 0;
};
const mapQuoteStatus = (status) => {
    if (status === true)
        return 'aprobada';
    if (status === false)
        return 'rechazada';
    return 'pendiente';
};
const mapInvoiceStatus = (status) => {
    if (status === true)
        return 'aprobada';
    if (status === false)
        return 'rechazada';
    return 'en_proceso';
};
const mapStatusFlag = (status) => {
    if (status === 'aprobada')
        return true;
    if (status === 'rechazada')
        return false;
    if (status === 'pendiente')
        return null;
    return null;
};
const formatCurrencyString = (value) => value.toFixed(2);
const computeQuoteTotal = (quote) => {
    const totalFromDetails = quote.quote_detail.reduce((sum, detail) => sum + toNumber(detail.total_value), 0);
    if (totalFromDetails > 0) {
        return totalFromDetails;
    }
    return toNumber(quote.value);
};
export async function listQuotes() {
    const records = await prisma.quote.findMany({
        include: {
            client: true,
            quote_detail: true,
        },
        orderBy: {
            created: 'desc',
        },
    });
    return records.map((quote) => {
        const services = Array.isArray(quote.quote_detail) ? quote.quote_detail.length : 0;
        const amount = computeQuoteTotal({ value: quote.value, quote_detail: quote.quote_detail ?? [] });
        return {
            id: quote.id,
            reference: normalizeText(quote.description, quote.id),
            client: {
                id: quote.client_id ?? null,
                name: quote.client ? normalizeText(quote.client.name, 'Cliente sin nombre') : 'Cliente sin nombre',
            },
            issuedAt: toIso(quote.created),
            updatedAt: toIso(quote.updated),
            status: mapQuoteStatus(quote.status ?? null),
            services,
            amount,
            pdfUrl: quote.url ?? null,
        };
    });
}
export async function getQuoteById(id) {
    const quote = await prisma.quote.findUnique({
        where: { id },
        include: {
            client: true,
            quote_detail: {
                include: {
                    service: true,
                },
            },
            quote_attachment: {
                include: {
                    invoice: true,
                },
            },
        },
    });
    if (!quote) {
        return null;
    }
    const services = (quote.quote_detail ?? []).map((detail) => ({
        id: detail.id,
        serviceId: detail.service_id ?? null,
        serviceName: detail.service ? normalizeText(detail.service.name, 'Servicio sin nombre') : 'Servicio sin nombre',
        quantity: detail.quantity ?? 0,
        unit: detail.service?.unit ?? null,
        total: toNumber(detail.total_value),
        status: mapQuoteStatus(detail.status ?? null),
    }));
    const attachments = (quote.quote_attachment ?? []).map((attachment) => ({
        id: attachment.id,
        invoiceId: attachment.invoice_id ?? null,
        invoiceNumber: attachment.invoice
            ? normalizeText(attachment.invoice.description, attachment.invoice.id)
            : attachment.invoice_id ?? null,
        invoiceStatus: mapInvoiceStatus(attachment.invoice?.status ?? null),
        invoiceAmount: toNumber(attachment.invoice?.value ?? null),
        invoiceUrl: attachment.invoice?.url ?? null,
    }));
    const hasInvoice = attachments.some((attachment) => Boolean(attachment.invoiceId));
    const amount = computeQuoteTotal({ value: quote.value, quote_detail: quote.quote_detail ?? [] });
    const actions = [
        {
            type: 'pdf',
            label: 'Descargar PDF',
            available: true,
            url: quote.url ?? `https://docs.local/quotes/${quote.id}.pdf`,
        },
        {
            type: 'email',
            label: 'Enviar por correo',
            available: true,
        },
        {
            type: 'invoice',
            label: 'Convertir a factura',
            available: !hasInvoice,
            disabledReason: hasInvoice ? 'La cotización ya fue convertida en factura' : null,
        },
    ];
    return {
        id: quote.id,
        reference: normalizeText(quote.description, quote.id),
        description: quote.description ?? null,
        status: mapQuoteStatus(quote.status ?? null),
        amount,
        issuedAt: toIso(quote.created),
        updatedAt: toIso(quote.updated),
        client: {
            id: quote.client_id ?? null,
            name: quote.client ? normalizeText(quote.client.name, 'Cliente sin nombre') : 'Cliente sin nombre',
        },
        services,
        attachments,
        actions,
    };
}
export async function generateQuotePdf(id) {
    const quote = await prisma.quote.findUnique({
        where: { id },
        select: {
            id: true,
            url: true,
        },
    });
    if (!quote) {
        return null;
    }
    const now = new Date();
    const url = quote.url ?? `https://docs.local/quotes/${quote.id}.pdf`;
    const updated = await prisma.quote.update({
        where: { id },
        data: {
            url,
            updated: now,
        },
        select: {
            id: true,
            url: true,
            updated: true,
        },
    });
    return {
        id: updated.id,
        url: updated.url,
        generatedAt: toIso(updated.updated),
    };
}
export async function sendQuoteByEmail(id, payload) {
    const quote = await prisma.quote.findUnique({
        where: { id },
        include: {
            client: true,
        },
    });
    if (!quote) {
        return null;
    }
    const recipients = (payload.recipients ?? [])
        .map((recipient) => (typeof recipient === 'string' ? recipient.trim() : ''))
        .filter((recipient) => recipient.length > 0);
    if (recipients.length === 0) {
        throw new Error('Debe proporcionar al menos un destinatario válido');
    }
    const now = new Date();
    await prisma.quote.update({
        where: { id },
        data: {
            updated: now,
        },
    });
    return {
        id: quote.id,
        subject: `Cotización ${normalizeText(quote.description, quote.id)}`,
        recipients,
        message: typeof payload.message === 'string' ? payload.message : null,
        sentAt: now.toISOString(),
    };
}
export async function convertQuoteToInvoice(id) {
    const quote = await prisma.quote.findUnique({
        where: { id },
        include: {
            quote_detail: true,
            quote_attachment: true,
        },
    });
    if (!quote) {
        return null;
    }
    const existingAttachment = quote.quote_attachment.find((attachment) => Boolean(attachment.invoice_id));
    if (existingAttachment?.invoice_id) {
        return {
            invoiceId: existingAttachment.invoice_id,
            alreadyConverted: true,
        };
    }
    const now = new Date();
    const total = computeQuoteTotal({ value: quote.value, quote_detail: quote.quote_detail ?? [] });
    const invoiceId = randomUUID();
    const invoice = await prisma.$transaction(async (tx) => {
        const createdInvoice = await tx.invoice.create({
            data: {
                id: invoiceId,
                client_id: quote.client_id,
                description: quote.description ?? `Factura generada desde la cotización ${quote.id}`,
                value: total.toFixed(2),
                url: quote.url,
                created: now,
                updated: now,
                status: false,
            },
        });
        const details = (quote.quote_detail ?? []).map((detail, index) => ({
            id: randomUUID(),
            invoice_id: invoiceId,
            service_id: detail.service_id,
            item: index + 1,
            quantity: detail.quantity ?? 1,
            total_value: detail.total_value ?? total,
            created: now,
            updated: now,
            status: detail.status ?? true,
        }));
        if (details.length > 0) {
            await tx.invoice_detail.createMany({
                data: details,
            });
        }
        await tx.quote_attachment.create({
            data: {
                id: randomUUID(),
                quote_id: quote.id,
                invoice_id: invoiceId,
            },
        });
        await tx.quote.update({
            where: { id: quote.id },
            data: {
                status: true,
                updated: now,
            },
        });
        return createdInvoice;
    });
    return {
        invoiceId: invoice.id,
        alreadyConverted: false,
        description: invoice.description,
        amount: toNumber(invoice.value),
        createdAt: toIso(invoice.created),
    };
}
export async function updateQuote(id, payload) {
    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) {
        return null;
    }
    const data = { updated: new Date() };
    if (typeof payload.description !== 'undefined') {
        data.description = payload.description ?? null;
    }
    if (typeof payload.status !== 'undefined') {
        data.status = mapStatusFlag(payload.status ?? null);
    }
    if (typeof payload.amount !== 'undefined') {
        data.value = payload.amount === null ? null : formatCurrencyString(payload.amount);
    }
    if (typeof payload.url !== 'undefined') {
        data.url = payload.url ?? null;
    }
    await prisma.quote.update({
        where: { id },
        data,
    });
    return getQuoteById(id);
}
