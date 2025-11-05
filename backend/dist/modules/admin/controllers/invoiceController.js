import { fetchInvoices, fetchInvoiceById, createInvoice, updateInvoice, deleteInvoice, sendInvoiceEmail, generateInvoiceArtifact, fetchInvoiceCatalog, listInvoiceObservationsByInvoice, createInvoiceObservation, updateInvoiceObservation, deleteInvoiceObservation, listInvoiceCommentsByInvoice, fetchPendingInvoicesByClient, } from '../services/invoiceService.js';
import { saveBase64File } from '../../../utils/fileStorage.js';
const INVOICE_STATUSES = ['paid', 'pending', 'cancelled'];
const isInvoiceStatus = (value) => typeof value === 'string' && INVOICE_STATUSES.includes(value);
const parseNumber = (value) => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
        const normalized = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
        const parsed = Number.parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
};
const sanitizeDetails = (input) => {
    if (!Array.isArray(input))
        return [];
    return input
        .map((detail) => ({
        serviceId: typeof detail?.serviceId === 'string' ? detail.serviceId.trim() : '',
        quantity: parseNumber(detail?.quantity) ?? 0,
        total: parseNumber(detail?.total) ?? 0,
        item: parseNumber(detail?.item) ?? null,
    }))
        .filter((detail) => detail.serviceId);
};
const parseFilePayload = (input) => {
    if (!input || typeof input !== 'object')
        return null;
    const name = typeof input?.name === 'string' ? input.name.trim() : '';
    const data = typeof input?.data === 'string' ? input.data.trim() : '';
    const type = typeof input?.type === 'string' ? input.type.trim() : null;
    if (!name || !data)
        return null;
    return { name, data, type };
};
const parseInvoicePayload = (body) => {
    const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : '';
    const serviceId = typeof body?.serviceId === 'string' ? body.serviceId.trim() : '';
    const number = typeof body?.number === 'string' ? body.number.trim() : '';
    const status = isInvoiceStatus(body?.status) ? body.status : 'pending';
    const issuedAt = typeof body?.issuedAt === 'string' ? body.issuedAt : undefined;
    const dueAt = typeof body?.dueAt === 'string' ? body.dueAt : undefined;
    const url = typeof body?.url === 'string' ? body.url.trim() || null : undefined;
    const description = typeof body?.description === 'string' ? body.description.trim() : undefined;
    const documentFile = parseFilePayload(body?.documentFile);
    const details = sanitizeDetails(body?.details);
    const subtotal = parseNumber(body?.subtotal);
    const taxOne = parseNumber(body?.taxOne);
    const taxTwo = parseNumber(body?.taxTwo);
    const includeIva = (() => {
        if (typeof body?.includeIva === 'boolean')
            return body.includeIva;
        if (typeof body?.includeIVA === 'boolean')
            return body.includeIVA;
        if (typeof body?.iva === 'boolean')
            return body.iva;
        if (typeof body?.includeIva === 'string') {
            const normalized = body.includeIva.trim().toLowerCase();
            return normalized === 'true' || normalized === '1';
        }
        return false;
    })();
    if (!clientId) {
        return { error: 'El cliente es obligatorio' };
    }
    if (!serviceId) {
        return { error: 'El servicio es obligatorio' };
    }
    if (!number) {
        return { error: 'El número de factura es obligatorio' };
    }
    const payload = {
        clientId,
        serviceId,
        number,
        description: description ?? null,
        includeIva,
        subtotal: typeof subtotal === 'number' ? subtotal : undefined,
        taxOne: typeof taxOne === 'number' ? taxOne : undefined,
        taxTwo: typeof taxTwo === 'number' ? taxTwo : undefined,
        status,
        issuedAt: issuedAt ?? null,
        dueAt: dueAt ?? null,
        url: url ?? null,
        details,
    };
    return documentFile ? { data: payload, documentFile } : { data: payload };
};
const parseRecipient = (body) => {
    if (typeof body?.recipient === 'string')
        return body.recipient.trim();
    if (typeof body?.email === 'string')
        return body.email.trim();
    if (typeof body?.to === 'string')
        return body.to.trim();
    return '';
};
export async function listInvoicesCtrl(_req, res) {
    const invoices = await fetchInvoices();
    res.json({ success: true, data: { invoices } });
}
export async function getInvoiceByIdCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la factura' });
    }
    const invoice = await fetchInvoiceById(id);
    if (!invoice) {
        return res.status(404).json({ success: false, message: 'Factura no encontrada' });
    }
    res.json({ success: true, data: { invoice } });
}
export async function getInvoiceCatalogCtrl(_req, res) {
    const catalog = await fetchInvoiceCatalog();
    res.json({ success: true, data: catalog });
}
export async function createInvoiceCtrl(req, res) {
    const parsed = parseInvoicePayload(req.body);
    if ('error' in parsed) {
        return res.status(400).json({ success: false, message: parsed.error });
    }
    try {
        const payload = { ...parsed.data };
        if (parsed.documentFile) {
            try {
                payload.url = await saveBase64File(parsed.documentFile, { folder: 'invoices' });
            }
            catch (fileError) {
                console.error('createInvoiceCtrl file error', fileError);
                return res.status(400).json({ success: false, message: 'No fue posible procesar el archivo adjunto' });
            }
        }
        const invoice = await createInvoice(payload);
        return res.status(201).json({ success: true, data: { invoice } });
    }
    catch (error) {
        console.error('createInvoiceCtrl error', error);
        if (error instanceof Error && error.message === 'SERVICE_NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
        }
        return res.status(500).json({ success: false, message: 'No fue posible crear la factura' });
    }
}
export async function updateInvoiceCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la factura' });
    }
    const parsed = parseInvoicePayload(req.body);
    if ('error' in parsed) {
        return res.status(400).json({ success: false, message: parsed.error });
    }
    try {
        const payload = { ...parsed.data };
        if (parsed.documentFile) {
            try {
                payload.url = await saveBase64File(parsed.documentFile, { folder: 'invoices' });
            }
            catch (fileError) {
                console.error('updateInvoiceCtrl file error', fileError);
                return res.status(400).json({ success: false, message: 'No fue posible procesar el archivo adjunto' });
            }
        }
        const invoice = await updateInvoice(id, payload);
        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Factura no encontrada' });
        }
        return res.json({ success: true, data: { invoice } });
    }
    catch (error) {
        console.error('updateInvoiceCtrl error', error);
        if (error instanceof Error && error.message === 'SERVICE_NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
        }
        if (error instanceof Error && error.message === 'INVOICE_HAS_PAYMENTS') {
            return res.status(400).json({ success: false, message: 'No se puede modificar una factura que tiene pagos asociados' });
        }
        return res.status(500).json({ success: false, message: 'No fue posible actualizar la factura' });
    }
}
export async function deleteInvoiceCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la factura' });
    }
    try {
        await deleteInvoice(id);
        return res.status(204).send();
    }
    catch (error) {
        console.error('deleteInvoiceCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible eliminar la factura' });
    }
}
export async function sendInvoiceEmailCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la factura' });
    }
    const recipient = parseRecipient(req.body);
    if (!recipient) {
        return res.status(400).json({ success: false, message: 'El destinatario es obligatorio' });
    }
    try {
        const result = await sendInvoiceEmail(id, recipient);
        return res.json({ success: true, data: result });
    }
    catch (error) {
        console.error('sendInvoiceEmailCtrl error', error);
        const message = typeof error?.message === 'string' ? error.message : 'No fue posible enviar la factura';
        if (message === 'Factura no encontrada') {
            return res.status(404).json({ success: false, message });
        }
        if (message === 'Destinatario inválido') {
            return res.status(400).json({ success: false, message });
        }
        return res.status(500).json({ success: false, message: 'No fue posible enviar la factura' });
    }
}
export async function downloadInvoiceArtifactCtrl(req, res) {
    const { id, format } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la factura' });
    }
    const normalizedFormat = (format ?? '').toLowerCase();
    if (!['pdf', 'xml', 'zip'].includes(normalizedFormat)) {
        return res.status(400).json({ success: false, message: 'Formato de descarga inválido' });
    }
    try {
        const artifact = await generateInvoiceArtifact(id, normalizedFormat);
        res.setHeader('Content-Type', artifact.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${artifact.filename}"`);
        return res.send(artifact.content);
    }
    catch (error) {
        console.error('downloadInvoiceArtifactCtrl error', error);
        const message = typeof error?.message === 'string' ? error.message : 'No fue posible generar la descarga';
        if (message === 'Factura no encontrada') {
            return res.status(404).json({ success: false, message });
        }
        return res.status(500).json({ success: false, message: 'No fue posible generar la descarga' });
    }
}
// ===========================
// Observaciones de Facturas
// ===========================
export async function listInvoiceObservationsCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la factura' });
    }
    try {
        const observations = await listInvoiceObservationsByInvoice(id);
        return res.json({ success: true, data: observations });
    }
    catch (error) {
        console.error('listInvoiceObservationsCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible obtener las observaciones' });
    }
}
export async function createInvoiceObservationCtrl(req, res) {
    const { id } = req.params;
    const { content } = req.body ?? {};
    if (!id || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Datos inválidos para crear la observación' });
    }
    try {
        const observation = await createInvoiceObservation({ invoiceId: id, content: content.trim(), userId: req?.user?.id ?? null });
        return res.status(201).json({ success: true, data: observation });
    }
    catch (error) {
        console.error('createInvoiceObservationCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible crear la observación' });
    }
}
export async function updateInvoiceObservationCtrl(req, res) {
    const { observationId } = req.params;
    const { content } = req.body ?? {};
    if (!observationId || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Datos inválidos para actualizar la observación' });
    }
    try {
        const observation = await updateInvoiceObservation(observationId, { content: content.trim() });
        if (!observation) {
            return res.status(404).json({ success: false, message: 'Observación no encontrada' });
        }
        return res.json({ success: true, data: observation });
    }
    catch (error) {
        console.error('updateInvoiceObservationCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible actualizar la observación' });
    }
}
export async function deleteInvoiceObservationCtrl(req, res) {
    const { observationId } = req.params;
    if (!observationId) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la observación' });
    }
    try {
        await deleteInvoiceObservation(observationId);
        return res.status(204).send();
    }
    catch (error) {
        console.error('deleteInvoiceObservationCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible eliminar la observación' });
    }
}
// ======================
// Comentarios (solo VER)
// ======================
export async function listInvoiceCommentsCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la factura' });
    }
    try {
        const comments = await listInvoiceCommentsByInvoice(id);
        return res.json({ success: true, data: comments });
    }
    catch (error) {
        console.error('listInvoiceCommentsCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible obtener los comentarios' });
    }
}
// ======================
// Facturas Pendientes para Pagos
// ======================
export async function getPendingInvoicesByClientCtrl(req, res) {
    const { clientId } = req.params;
    if (!clientId) {
        return res.status(400).json({ success: false, message: 'Falta el identificador del cliente' });
    }
    try {
        const invoices = await fetchPendingInvoicesByClient(clientId);
        return res.json({ success: true, data: { invoices } });
    }
    catch (error) {
        console.error('getPendingInvoicesByClientCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible obtener las facturas pendientes' });
    }
}
