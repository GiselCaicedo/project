import { prisma } from '../../../config/db.js';
import { randomUUID } from 'node:crypto';
const PAID_KEYWORDS = ['paid', 'pag', 'aprob', 'complet', 'success', 'cobrad'];
const PENDING_KEYWORDS = ['pend', 'proces', 'waiting', 'hold', 'due', 'unpaid', 'por cobrar'];
const normalizeStatusValue = (value) => value?.trim().toLowerCase() ?? '';
const guessStatusFlag = (statusPay, confirmed) => {
    const normalized = normalizeStatusValue(statusPay);
    if (normalized) {
        if (PAID_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
            return true;
        }
        if (PENDING_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
            return false;
        }
    }
    if (typeof confirmed === 'boolean') {
        return confirmed;
    }
    return null;
};
const resolvePaymentMethod = async (methodId, methodName) => {
    if (methodId) {
        const existing = await prisma.payment_method.findUnique({ where: { id: methodId } });
        if (existing) {
            return { id: existing.id, name: existing.name ?? existing.id };
        }
    }
    const trimmedName = methodName?.trim() ?? '';
    if (trimmedName.length === 0) {
        return { id: methodId ?? null, name: methodName ?? null };
    }
    const existingByName = await prisma.payment_method.findUnique({ where: { name: trimmedName } });
    if (existingByName) {
        return { id: existingByName.id, name: existingByName.name ?? trimmedName };
    }
    const created = await prisma.payment_method.create({
        data: { id: randomUUID(), name: trimmedName },
    });
    return { id: created.id, name: created.name ?? trimmedName };
};
const parseDate = (value) => {
    if (!value)
        return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};
const generatePaymentReference = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    // Get the count of payments created this month
    const startOfMonth = new Date(year, now.getMonth(), 1);
    const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999);
    const count = await prisma.payment.count({
        where: {
            created: {
                gte: startOfMonth,
                lte: endOfMonth,
            },
        },
    });
    const sequence = String(count + 1).padStart(4, '0');
    return `PAG-${year}${month}-${sequence}`;
};
const sanitizeAttachments = (attachments) => {
    if (!Array.isArray(attachments) || attachments.length === 0) {
        return [];
    }
    const seen = new Set();
    return attachments
        .map((attachment) => ({
        id: attachment.id?.trim() || randomUUID(),
        url: attachment.url?.trim() ?? '',
        invoice_id: attachment.invoiceId?.trim() ?? null,
    }))
        .filter((attachment) => {
        if (!attachment.url)
            return false;
        if (seen.has(attachment.id))
            return false;
        seen.add(attachment.id);
        return true;
    });
};
/**
 * Lista todos los pagos de un cliente
 */
export async function listClientPayments(clientId) {
    return await prisma.payment.findMany({
        where: {
            client_id: clientId,
            status: true,
        },
        include: {
            payment_method: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        orderBy: {
            created: 'desc',
        },
    });
}
/**
 * Obtiene el detalle de un pago específico
 */
export async function fetchClientPaymentById(clientId, paymentId) {
    return await prisma.payment.findFirst({
        where: {
            id: paymentId,
            client_id: clientId,
            status: true,
        },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                },
            },
            payment_method: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
}
/**
 * Obtiene todos los métodos de pago disponibles
 */
export async function listPaymentMethods() {
    return await prisma.payment_method.findMany({
        orderBy: {
            name: 'asc',
        },
    });
}
/**
 * Obtiene las facturas del cliente (para vincular al pago)
 * Solo retorna facturas aprobadas: pendientes (null) o pagadas (true)
 * Excluye facturas canceladas (false)
 */
export async function listClientInvoicesForPayment(clientId) {
    const invoices = await prisma.invoice.findMany({
        where: {
            client_id: clientId,
            OR: [
                { status: null }, // Facturas pendientes
                { status: true }, // Facturas pagadas (pero pueden tener saldo pendiente)
            ],
        },
        orderBy: {
            created: 'desc',
        },
    });
    // Mapear facturas a formato para el formulario de pago
    return invoices.map((invoice) => ({
        id: invoice.id,
        code: invoice.consecutive ?? invoice.description ?? null,
        value: invoice.total ? invoice.total.toString() : invoice.value,
        status_pay: invoice.status === true ? 'Pagada' : 'Pendiente',
        created: invoice.created,
    }));
}
/**
 * Crea un nuevo pago con toda la lógica similar al admin
 */
export async function createPayment(payload) {
    const method = await resolvePaymentMethod(payload.methodId, payload.methodName);
    const paidAt = parseDate(payload.paidAt);
    const now = new Date();
    const timestamp = paidAt ?? now;
    const statusFlag = guessStatusFlag(payload.status, payload.confirmed);
    // Generate automatic reference
    const reference = await generatePaymentReference();
    // Create payment
    const payment = await prisma.payment.create({
        data: {
            id: randomUUID(),
            client_id: payload.clientId,
            code: reference,
            value: payload.value,
            status_pay: payload.status?.trim() || 'pendiente',
            method: method.name ?? payload.methodName?.trim() ?? null,
            payment_method_id: method.id,
            type: payload.type?.trim() || null,
            url: payload.receiptUrl?.trim() || null,
            created: timestamp,
            updated: timestamp,
            status: statusFlag,
        },
        include: {
            payment_method: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
    // Create attachments if any
    const attachments = sanitizeAttachments(payload.attachments);
    if (attachments.length > 0) {
        await prisma.payment_attachment.createMany({
            data: attachments.map((attachment) => ({
                id: attachment.id,
                invoice_id: attachment.invoice_id,
                url: attachment.url,
                created: now,
            })),
        });
    }
    return payment;
}
