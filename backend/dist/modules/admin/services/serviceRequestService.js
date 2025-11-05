import { prisma } from '../../../config/db.js';
const toIso = (d) => (d ? d.toISOString() : null);
const mapRequest = (r) => ({
    id: r.id,
    client: { id: r.client?.id ?? r.client_id, name: r.client?.name ?? 'Cliente' },
    service: { id: r.service?.id ?? r.service_id, name: r.service?.name ?? 'Servicio' },
    description: r.description ?? null,
    status: (() => { const s = String(r.status ?? 'abierto').toLowerCase(); if (s === 'cerrado' || s === 'closed')
        return 'cerrado'; if (s === 'proceso' || s === 'in_progress' || s === 'process')
        return 'proceso'; return 'abierto'; })(),
    createdAt: toIso(r.created) ?? new Date().toISOString(),
    updatedAt: toIso(r.updated),
    reviewedBy: r.user ? { id: r.user.id, name: r.user.name ?? 'Revisor' } : null,
    reviewedAt: toIso(r.reviewed_at),
    notes: r.notes ?? null,
});
export async function listServiceRequests() {
    const rows = await prisma.service_request.findMany({
        include: {
            client: { select: { id: true, name: true } },
            service: { select: { id: true, name: true } },
            user: { select: { id: true, name: true } },
        },
        orderBy: { created: 'desc' },
    });
    return rows.map(mapRequest);
}
export async function updateServiceRequest(id, status, options) {
    try {
        const data = {
            status,
            updated: new Date(),
        };
        if (options?.notes !== undefined)
            data.notes = options.notes;
        if (options?.reviewerId) {
            data.reviewed_by = options.reviewerId;
            data.reviewed_at = new Date();
        }
        const row = await prisma.service_request.update({
            where: { id },
            data,
            include: {
                client: { select: { id: true, name: true } },
                service: { select: { id: true, name: true } },
                user: { select: { id: true, name: true } },
            },
        });
        return mapRequest(row);
    }
    catch (error) {
        if (error?.code === 'P2025')
            return null;
        throw error;
    }
}
