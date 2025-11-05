import { convertQuoteToInvoice, createQuote, deleteQuote, generateQuotePdf, getQuoteById, listQuotes, sendQuoteByEmail, updateQuote, createObservation, updateObservation, deleteObservation, listObservationsByQuote, updateQuoteServices, QuoteAlreadyInvoicedError, QuoteNotFoundError, QuoteValidationError, } from '../services/quoteService.js';
export async function listQuotesCtrl(_req, res) {
    const data = await listQuotes();
    res.json({ success: true, data });
}
export async function createQuoteCtrl(req, res) {
    const parsed = parseQuoteCreatePayload(req.body);
    if ('error' in parsed) {
        return res.status(400).json({ success: false, message: parsed.error });
    }
    try {
        const quote = await createQuote(parsed.data);
        return res.status(201).json({ success: true, data: quote });
    }
    catch (error) {
        console.error('createQuoteCtrl error', error);
        if (error instanceof QuoteValidationError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'No fue posible crear la cotización' });
    }
}
export async function getQuoteByIdCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' });
    }
    const quote = await getQuoteById(id);
    if (!quote) {
        return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
    }
    return res.json({ success: true, data: quote });
}
export async function generateQuotePdfCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' });
    }
    try {
        const payload = await generateQuotePdf(id);
        if (!payload) {
            return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
        }
        return res.json({ success: true, data: payload });
    }
    catch (error) {
        console.error('generateQuotePdfCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible generar el PDF de la cotización' });
    }
}
const parseSendQuotePayload = (body) => {
    const recipients = Array.isArray(body?.recipients) ? body.recipients : [];
    const normalized = recipients
        .map((recipient) => (typeof recipient === 'string' ? recipient.trim() : ''))
        .filter((recipient) => recipient.length > 0);
    if (normalized.length === 0) {
        return { error: 'Debe indicar al menos un destinatario' };
    }
    const message = typeof body?.message === 'string' ? body.message : undefined;
    return { recipients: normalized, message };
};
export async function sendQuoteEmailCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' });
    }
    const payload = parseSendQuotePayload(req.body);
    if ('error' in payload) {
        return res.status(400).json({ success: false, message: payload.error });
    }
    try {
        const result = await sendQuoteByEmail(id, payload);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
        }
        return res.json({ success: true, data: result });
    }
    catch (error) {
        console.error('sendQuoteEmailCtrl error', error);
        const message = error instanceof Error ? error.message : 'No fue posible enviar la cotización';
        return res.status(400).json({ success: false, message });
    }
}
export async function convertQuoteToInvoiceCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' });
    }
    try {
        const payload = await convertQuoteToInvoice(id);
        if (!payload) {
            return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
        }
        if (payload.alreadyConverted) {
            return res.status(200).json({ success: true, data: payload });
        }
        return res.status(201).json({ success: true, data: payload });
    }
    catch (error) {
        console.error('convertQuoteToInvoiceCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible convertir la cotización en factura' });
    }
}
const QUOTE_STATUSES = ['pendiente', 'aprobada', 'rechazada'];
const isQuoteStatus = (value) => typeof value === 'string' && QUOTE_STATUSES.includes(value);
const parseAmount = (value) => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length === 0) {
            return null;
        }
        const normalized = trimmed.replace(/[^0-9.,-]/g, '').replace(',', '.');
        const parsed = Number.parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    if (value === null) {
        return null;
    }
    return undefined;
};
const parsePositiveQuantity = (value) => {
    if (typeof value === 'number') {
        return Number.isFinite(value) && value > 0 ? value : undefined;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length === 0) {
            return undefined;
        }
        const normalized = trimmed.replace(/[^0-9.,-]/g, '').replace(',', '.');
        const parsed = Number.parseFloat(normalized);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            return undefined;
        }
        return parsed;
    }
    return undefined;
};
const parseOptionalDateInput = (value) => {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? undefined : value;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length === 0) {
            return undefined;
        }
        const parsed = new Date(trimmed);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
};
const parseQuoteServicesPayload = (value) => {
    if (!Array.isArray(value) || value.length === 0) {
        return { error: 'Debe asociar al menos un servicio a la cotización' };
    }
    const services = [];
    for (const entry of value) {
        const serviceId = typeof entry?.serviceId === 'string' ? entry.serviceId.trim() : '';
        if (serviceId.length === 0) {
            return { error: 'Cada servicio debe incluir un identificador válido' };
        }
        const quantity = parsePositiveQuantity(entry?.quantity);
        if (typeof quantity === 'undefined') {
            return { error: `Cantidad inválida para el servicio ${serviceId}` };
        }
        const hasUnitPrice = Object.prototype.hasOwnProperty.call(entry ?? {}, 'unitPrice');
        const unitPriceValue = parseAmount(entry?.unitPrice);
        if (hasUnitPrice && typeof unitPriceValue === 'undefined') {
            return { error: `Precio unitario inválido para el servicio ${serviceId}` };
        }
        const hasTotal = Object.prototype.hasOwnProperty.call(entry ?? {}, 'total');
        const totalValue = parseAmount(entry?.total);
        if (hasTotal && typeof totalValue === 'undefined') {
            return { error: `Total inválido para el servicio ${serviceId}` };
        }
        const servicePayload = {
            serviceId,
            quantity,
        };
        if (typeof unitPriceValue === 'number') {
            servicePayload.unitPrice = unitPriceValue;
        }
        if (typeof totalValue === 'number') {
            servicePayload.total = totalValue;
        }
        services.push(servicePayload);
    }
    return services;
};
const parseQuoteCreatePayload = (body) => {
    const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : '';
    if (clientId.length === 0) {
        return { error: 'Debe indicar el cliente de la cotización' };
    }
    const servicesResult = parseQuoteServicesPayload(body?.services);
    if ('error' in servicesResult) {
        return servicesResult;
    }
    const descriptionValue = typeof body?.description === 'string' ? body.description.trim() : undefined;
    const issuedAtValue = parseOptionalDateInput(body?.issuedAt);
    const payload = {
        clientId,
        services: servicesResult,
    };
    if (typeof descriptionValue !== 'undefined') {
        payload.description = descriptionValue.length > 0 ? descriptionValue : null;
    }
    if (issuedAtValue) {
        payload.issuedAt = issuedAtValue;
    }
    return { data: payload };
};
const parseQuoteUpdatePayload = (body) => {
    const descriptionValue = typeof body?.description === 'string' ? body.description.trim() : undefined;
    const statusValue = isQuoteStatus(body?.status) ? body.status : undefined;
    const amountValue = parseAmount(body?.amount);
    const urlValue = typeof body?.url === 'string' ? body.url.trim() : undefined;
    if (typeof descriptionValue === 'undefined'
        && typeof statusValue === 'undefined'
        && typeof amountValue === 'undefined'
        && typeof urlValue === 'undefined') {
        return { error: 'Debe proporcionar información para actualizar la cotización' };
    }
    const payload = {};
    if (typeof descriptionValue !== 'undefined') {
        payload.description = descriptionValue.length > 0 ? descriptionValue : null;
    }
    if (typeof statusValue !== 'undefined') {
        payload.status = statusValue;
    }
    if (typeof amountValue !== 'undefined') {
        payload.amount = amountValue;
    }
    if (typeof urlValue !== 'undefined') {
        payload.url = urlValue.length > 0 ? urlValue : null;
    }
    return { data: payload };
};
export async function updateQuoteCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' });
    }
    const parsed = parseQuoteUpdatePayload(req.body);
    if ('error' in parsed) {
        return res.status(400).json({ success: false, message: parsed.error });
    }
    try {
        const quote = await updateQuote(id, parsed.data);
        if (!quote) {
            return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
        }
        return res.json({ success: true, data: quote });
    }
    catch (error) {
        console.error('updateQuoteCtrl error', error);
        if (error instanceof QuoteAlreadyInvoicedError) {
            return res.status(409).json({ success: false, message: error.message });
        }
        if (error instanceof QuoteValidationError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'No fue posible actualizar la cotización' });
    }
}
export async function updateQuoteServicesCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' });
    }
    const servicesResult = parseQuoteServicesPayload(req.body?.services);
    if ('error' in servicesResult) {
        return res.status(400).json({ success: false, message: servicesResult.error });
    }
    try {
        const quote = await updateQuoteServices(id, servicesResult);
        if (!quote) {
            return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
        }
        return res.json({ success: true, data: quote });
    }
    catch (error) {
        console.error('updateQuoteServicesCtrl error', error);
        if (error instanceof QuoteAlreadyInvoicedError) {
            return res.status(409).json({ success: false, message: error.message });
        }
        if (error instanceof QuoteValidationError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'No fue posible actualizar los servicios de la cotización' });
    }
}
export async function deleteQuoteCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' });
    }
    try {
        await deleteQuote(id);
        return res.status(204).send();
    }
    catch (error) {
        if (error instanceof QuoteNotFoundError) {
            return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
        }
        if (error instanceof QuoteAlreadyInvoicedError) {
            return res.status(409).json({ success: false, message: error.message });
        }
        console.error('deleteQuoteCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible eliminar la cotización' });
    }
}
/**
 * ================================
 * OBSERVACIONES (ADMIN)
 * ================================
 */
export async function createObservationCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' });
    }
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'El contenido de la observación es requerido' });
    }
    try {
        const userId = req?.user?.id;
        const payload = {
            quoteId: id,
            content: content.trim(),
            userId: userId ?? null,
        };
        const observation = await createObservation(payload);
        return res.status(201).json({ success: true, data: observation });
    }
    catch (error) {
        console.error('createObservationCtrl error', error);
        if (error instanceof QuoteValidationError || error instanceof QuoteNotFoundError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'No fue posible crear la observación' });
    }
}
export async function updateObservationCtrl(req, res) {
    const { observationId } = req.params;
    if (!observationId) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la observación' });
    }
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'El contenido de la observación es requerido' });
    }
    try {
        const payload = { content: content.trim() };
        const observation = await updateObservation(observationId, payload);
        if (!observation) {
            return res.status(404).json({ success: false, message: 'Observación no encontrada' });
        }
        return res.json({ success: true, data: observation });
    }
    catch (error) {
        console.error('updateObservationCtrl error', error);
        if (error instanceof QuoteValidationError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'No fue posible actualizar la observación' });
    }
}
export async function deleteObservationCtrl(req, res) {
    const { observationId } = req.params;
    if (!observationId) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la observación' });
    }
    try {
        await deleteObservation(observationId);
        return res.status(204).send();
    }
    catch (error) {
        console.error('deleteObservationCtrl error', error);
        if (error instanceof QuoteNotFoundError) {
            return res.status(404).json({ success: false, message: 'Observación no encontrada' });
        }
        return res.status(500).json({ success: false, message: 'No fue posible eliminar la observación' });
    }
}
export async function listObservationsByQuoteCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' });
    }
    try {
        const observations = await listObservationsByQuote(id);
        return res.json({ success: true, data: observations });
    }
    catch (error) {
        console.error('listObservationsByQuoteCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible obtener las observaciones' });
    }
}
