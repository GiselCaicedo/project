import { prisma } from '../../../config/db.js';
import { randomUUID } from 'node:crypto';
/**
 * Lista todas las facturas de un cliente
 */
export async function listClientInvoices(clientId) {
    return await prisma.invoice.findMany({
        where: {
            client_id: clientId,
            status: true,
        },
        include: {
            service: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                },
            },
            invoice_detail: {
                include: {
                    service: {
                        select: {
                            id: true,
                            name: true,
                            unit: true,
                            price: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            created: 'desc',
        },
    });
}
/**
 * Obtiene el detalle completo de una factura específica
 */
export async function fetchClientInvoiceById(clientId, invoiceId) {
    return await prisma.invoice.findFirst({
        where: {
            id: invoiceId,
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
            service: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    frequency: true,
                },
            },
            invoice_detail: {
                include: {
                    service: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            price: true,
                            unit: true,
                        },
                    },
                },
                orderBy: {
                    item: 'asc',
                },
            },
            payment_attachment: true,
        },
    });
}
export async function deleteClientInvoice(clientId, invoiceId) {
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, client_id: clientId } });
    if (!invoice)
        return false;
    await prisma.invoice_detail.deleteMany({ where: { invoice_id: invoiceId } });
    await prisma.payment_attachment.deleteMany({ where: { invoice_id: invoiceId } });
    await prisma.quote_attachment.deleteMany({ where: { invoice_id: invoiceId } });
    await prisma.invoice.delete({ where: { id: invoiceId } });
    return true;
}
export async function generateClientInvoiceArtifact(clientId, invoiceId, format) {
    // Seguridad básica: validar pertenencia
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, client_id: clientId } });
    if (!invoice)
        throw new Error('Factura no encontrada');
    const adminService = await import('../../admin/services/invoiceService.js');
    return adminService.generateInvoiceArtifact(invoiceId, format);
}
export async function listClientInvoiceObservations(clientId, invoiceId) {
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, client_id: clientId } });
    if (!invoice)
        return [];
    const rows = await prisma.invoice_observation.findMany({ where: { invoice_id: invoiceId, status: { not: false } }, orderBy: { created: 'desc' } });
    const toIso = (d) => (d instanceof Date ? d.toISOString() : d ? new Date(d).toISOString() : null);
    return rows.map((r) => ({ id: r.id, invoiceId: r.invoice_id, userId: r.user_id ?? null, content: r.content, created: toIso(r.created), updated: toIso(r.updated), status: r.status ?? null }));
}
export async function listClientInvoiceComments(clientId, invoiceId) {
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, client_id: clientId } });
    if (!invoice)
        return [];
    const rows = await prisma.invoice_comment.findMany({ where: { invoice_id: invoiceId, status: { not: false } }, orderBy: { created: 'desc' } });
    const toIso = (d) => (d instanceof Date ? d.toISOString() : d ? new Date(d).toISOString() : null);
    return rows.map((r) => ({ id: r.id, invoiceId: r.invoice_id, userId: r.user_id ?? null, content: r.content, created: toIso(r.created), updated: toIso(r.updated), status: r.status ?? null }));
}
export async function createClientInvoiceComment(clientId, payload) {
    const invoice = await prisma.invoice.findFirst({ where: { id: payload.invoiceId, client_id: clientId } });
    if (!invoice)
        throw new Error('Factura no pertenece al cliente');
    const created = await prisma.invoice_comment.create({ data: { id: randomUUID(), invoice_id: payload.invoiceId, user_id: payload.userId ?? null, content: payload.content, status: true } });
    const toIso = (d) => (d instanceof Date ? d.toISOString() : d ? new Date(d).toISOString() : null);
    return { id: created.id, invoiceId: created.invoice_id, userId: created.user_id ?? null, content: created.content, created: toIso(created.created), updated: toIso(created.updated), status: created.status ?? null };
}
export async function updateClientInvoiceComment(clientId, commentId, payload) {
    const existing = await prisma.invoice_comment.findUnique({ where: { id: commentId } });
    if (!existing)
        return null;
    const invoice = await prisma.invoice.findFirst({ where: { id: existing.invoice_id, client_id: clientId } });
    if (!invoice)
        return null;
    const updated = await prisma.invoice_comment.update({ where: { id: commentId }, data: { content: payload.content, updated: new Date() } });
    const toIso = (d) => (d instanceof Date ? d.toISOString() : d ? new Date(d).toISOString() : null);
    return { id: updated.id, invoiceId: updated.invoice_id, userId: updated.user_id ?? null, content: updated.content, created: toIso(updated.created), updated: toIso(updated.updated), status: updated.status ?? null };
}
export async function deleteClientInvoiceComment(clientId, commentId) {
    const existing = await prisma.invoice_comment.findUnique({ where: { id: commentId } });
    if (!existing)
        return false;
    const invoice = await prisma.invoice.findFirst({ where: { id: existing.invoice_id, client_id: clientId } });
    if (!invoice)
        return false;
    await prisma.invoice_comment.update({ where: { id: commentId }, data: { status: false, updated: new Date() } });
    return true;
}
export async function attachClientPaymentProof(clientId, invoiceId, url) {
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, client_id: clientId } });
    if (!invoice)
        throw new Error('Factura no pertenece al cliente');
    const created = await prisma.payment_attachment.create({
        data: {
            id: randomUUID(),
            invoice_id: invoiceId,
            url: url,
            created: new Date()
        }
    });
    return created;
}
