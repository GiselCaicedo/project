import { randomUUID } from 'node:crypto';
import { prisma } from '../../../config/db.js';
const PAID_KEYWORDS = ['paid', 'pag', 'aprob', 'complet', 'success', 'cobrad'];
const PENDING_KEYWORDS = ['pend', 'proces', 'waiting', 'hold', 'due', 'unpaid', 'por cobrar'];
const CANCELLED_KEYWORDS = ['cancel', 'anul', 'void', 'rechaz', 'declin'];
const FAILED_KEYWORDS = ['fail', 'error', 'fall', 'deneg', 'reject'];
const PAYMENT_INCLUDE = {
    client: { select: { id: true, name: true } },
    payment_method: { select: { id: true, name: true } },
};
const toIso = (value) => (value ? value.toISOString() : null);
const parseCurrency = (value) => {
    if (!value)
        return 0;
    const cleaned = value.replace(/[^0-9,.-]/g, '');
    const commaCount = (cleaned.match(/,/g) ?? []).length;
    const dotCount = (cleaned.match(/\./g) ?? []).length;
    let normalized = cleaned;
    if (commaCount > 0 && dotCount > 0) {
        if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
            normalized = normalized.replace(/\./g, '').replace(/,/g, '.');
        }
        else {
            normalized = normalized.replace(/,/g, '');
        }
    }
    else if (commaCount > 0) {
        normalized = normalized.replace(/,/g, '.');
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};
const normalizeText = (value, fallback = '') => {
    const trimmed = value?.trim();
    if (trimmed && trimmed.length > 0) {
        return trimmed;
    }
    return fallback;
};
const normalizeStatusValue = (value) => value?.trim().toLowerCase() ?? '';
const classifyPaymentStatus = (statusPay, statusFlag) => {
    const normalized = normalizeStatusValue(statusPay);
    if (normalized) {
        if (PAID_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
            return 'pagado';
        }
        if (PENDING_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
            return 'pendiente';
        }
        if (CANCELLED_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
            return 'anulado';
        }
        if (FAILED_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
            return 'fallido';
        }
    }
    if (typeof statusFlag === 'boolean') {
        return statusFlag ? 'pagado' : 'pendiente';
    }
    return 'otro';
};
const guessStatusFlag = (status, fallback) => {
    if (typeof fallback === 'boolean')
        return fallback;
    if (status === 'pagado')
        return true;
    if (status === 'pendiente')
        return false;
    return null;
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
const mapPaymentRecord = (payment) => {
    const status = classifyPaymentStatus(payment.status_pay, payment.status);
    const attachments = Array.isArray(payment.attachments)
        ? payment.attachments.map((attachment) => ({
            id: attachment.id,
            url: attachment.url ?? null,
            invoiceId: attachment.invoice_id ?? null,
            createdAt: toIso(attachment.created ?? null),
            updatedAt: toIso(attachment.updated ?? null),
        }))
        : [];
    return {
        id: payment.id,
        clientId: payment.client_id ?? payment.client?.id ?? null,
        clientName: normalizeText(payment.client?.name, 'Cliente sin nombre'),
        reference: payment.code ?? null,
        amount: parseCurrency(payment.value),
        amountRaw: payment.value ?? null,
        status,
        statusRaw: payment.status_pay ?? null,
        methodId: payment.payment_method?.id ?? payment.payment_method_id ?? null,
        methodName: normalizeText(payment.payment_method?.name ?? payment.method ?? null, payment.method ?? null) || null,
        type: payment.type ?? null,
        receiptUrl: payment.url ?? null,
        createdAt: toIso(payment.created ?? null),
        updatedAt: toIso(payment.updated ?? null),
        attachments,
    };
};
const mapClientRecord = (client) => ({
    id: client.id,
    name: normalizeText(client.name, 'Cliente sin nombre'),
});
const mapMethodRecord = (method) => ({
    id: method.id,
    name: normalizeText(method.name, 'Método sin nombre'),
});
const resolvePaymentMethod = async (methodId, methodName) => {
    if (methodId) {
        const existing = await prisma.payment_method.findUnique({ where: { id: methodId } });
        if (existing) {
            return { id: existing.id, name: normalizeText(existing.name, existing.id) };
        }
    }
    const trimmedName = methodName?.trim() ?? '';
    if (trimmedName.length === 0) {
        return { id: methodId ?? null, name: methodName ?? null };
    }
    const existingByName = await prisma.payment_method.findUnique({ where: { name: trimmedName } });
    if (existingByName) {
        return { id: existingByName.id, name: normalizeText(existingByName.name, trimmedName) };
    }
    const created = await prisma.payment_method.create({
        data: { id: randomUUID(), name: trimmedName },
    });
    return { id: created.id, name: normalizeText(created.name, trimmedName) };
};
const parseDate = (value) => {
    if (!value)
        return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};
export async function fetchPaymentsList() {
    const [payments, clients, methods] = await Promise.all([
        prisma.payment.findMany({
            include: PAYMENT_INCLUDE,
            orderBy: { updated: 'desc' },
        }),
        prisma.client.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        }),
        prisma.payment_method.findMany({
            orderBy: { name: 'asc' },
        }),
    ]);
    return {
        payments: payments.map((payment) => mapPaymentRecord(payment)),
        clients: clients.map(mapClientRecord),
        methods: methods.map(mapMethodRecord),
    };
}
export async function fetchPaymentById(id) {
    const payment = await prisma.payment.findUnique({ where: { id }, include: PAYMENT_INCLUDE });
    if (!payment)
        return null;
    return mapPaymentRecord(payment);
}
export async function createPayment(payload) {
    const method = await resolvePaymentMethod(payload.methodId, payload.methodName);
    const paidAt = parseDate(payload.paidAt);
    const now = new Date();
    const timestamp = paidAt ?? now;
    const status = classifyPaymentStatus(payload.status, payload.confirmed ?? null);
    const statusFlag = guessStatusFlag(status, payload.confirmed ?? null);
    const created = await prisma.payment.create({
        data: {
            id: randomUUID(),
            client_id: payload.clientId,
            code: payload.reference?.trim() || null,
            value: payload.value,
            status_pay: payload.status?.trim() || null,
            method: method.name ?? payload.methodName?.trim() ?? null,
            payment_method_id: method.id,
            type: payload.type?.trim() || null,
            url: payload.receiptUrl?.trim() || null,
            created: timestamp,
            updated: timestamp,
            status: statusFlag,
            // attachments are stored per-invoice; no relation to payment
        },
        include: PAYMENT_INCLUDE,
    });
    const methods = await prisma.payment_method.findMany({ orderBy: { name: 'asc' } });
    return {
        payment: mapPaymentRecord(created),
        methods: methods.map(mapMethodRecord),
    };
}
export async function updatePayment(id, payload) {
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) {
        return null;
    }
    const method = await resolvePaymentMethod(payload.methodId, payload.methodName);
    const paidAt = parseDate(payload.paidAt);
    const now = new Date();
    const timestamp = paidAt ?? now;
    const status = classifyPaymentStatus(payload.status, payload.confirmed ?? existing.status);
    const statusFlag = guessStatusFlag(status, payload.confirmed ?? existing.status);
    const updated = await prisma.payment.update({
        where: { id },
        data: {
            client_id: payload.clientId,
            code: payload.reference?.trim() || null,
            value: payload.value,
            status_pay: payload.status?.trim() || null,
            method: method.name ?? payload.methodName?.trim() ?? null,
            payment_method_id: method.id,
            type: payload.type?.trim() || null,
            url: payload.receiptUrl?.trim() || null,
            updated: timestamp,
            status: statusFlag,
            // attachments are stored per-invoice; no relation to payment
        },
        include: PAYMENT_INCLUDE,
    });
    const methods = await prisma.payment_method.findMany({ orderBy: { name: 'asc' } });
    return {
        payment: mapPaymentRecord(updated),
        methods: methods.map(mapMethodRecord),
    };
}
export async function deletePayment(id) {
    await prisma.payment.delete({ where: { id } });
    return true;
}
