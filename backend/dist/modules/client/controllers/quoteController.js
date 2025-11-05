import { listClientQuotes, fetchClientQuoteById, generateInvoiceFromQuote, submitClientQuote, createComment, updateComment, deleteComment, listCommentsByQuote, approveQuote, } from '../services/quoteService.js';
import { QuoteValidationError, QuoteNotFoundError } from '../../admin/services/quoteService.js';
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
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return value;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length === 0) {
            return undefined;
        }
        const normalized = trimmed.replace(/[^0-9.,-]/g, '').replace(',', '.');
        const parsed = Number.parseFloat(normalized);
        if (Number.isFinite(parsed) && parsed > 0) {
            return parsed;
        }
    }
    return undefined;
};
const parseClientQuoteServices = (value) => {
    if (!Array.isArray(value) || value.length === 0) {
        return { error: 'Debe seleccionar al menos un servicio' };
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
        const unitPrice = parseAmount(entry?.unitPrice);
        if (hasUnitPrice && typeof unitPrice === 'undefined') {
            return { error: `Precio unitario inválido para el servicio ${serviceId}` };
        }
        const hasTotal = Object.prototype.hasOwnProperty.call(entry ?? {}, 'total');
        const totalValue = parseAmount(entry?.total);
        if (hasTotal && typeof totalValue === 'undefined') {
            return { error: `Total inválido para el servicio ${serviceId}` };
        }
        const payload = {
            serviceId,
            quantity,
        };
        if (typeof unitPrice === 'number') {
            payload.unitPrice = unitPrice;
        }
        if (typeof totalValue === 'number') {
            payload.total = totalValue;
        }
        services.push(payload);
    }
    return services;
};
const parseClientQuotePayload = (body) => {
    const servicesResult = parseClientQuoteServices(body?.services);
    if ('error' in servicesResult) {
        return servicesResult;
    }
    const descriptionValue = typeof body?.description === 'string' ? body.description.trim() : undefined;
    const payload = {
        services: servicesResult,
    };
    if (typeof descriptionValue !== 'undefined') {
        payload.description = descriptionValue.length > 0 ? descriptionValue : null;
    }
    return { data: payload };
};
const mapQuoteStatus = (status) => {
    if (status === true || status === 'aprobada')
        return 'aprobada';
    if (status === false || status === 'rechazada')
        return 'rechazada';
    return 'pendiente';
};
const toNumber = (value) => {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    if (typeof value === 'object' && value !== null && typeof value.valueOf === 'function') {
        const parsed = Number(value.valueOf());
        return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
};
const mapInvoiceSummary = (attachments) => {
    const attachment = attachments.find((entry) => Boolean(entry.invoice_id));
    if (!attachment) {
        return null;
    }
    const invoice = attachment.invoice ?? null;
    if (!invoice) {
        return {
            id: attachment.invoice_id ?? null,
            number: attachment.invoice_id ?? null,
            status: 'pendiente',
            amount: null,
        };
    }
    // Facturas solo tienen 2 estados: pagada (true) o pendiente (false/null)
    const status = invoice.status === true ? 'pagada' : 'pendiente';
    return {
        id: attachment.invoice_id ?? null,
        number: invoice.consecutive ?? invoice.description ?? attachment.invoice_id ?? null,
        status,
        amount: toNumber(invoice.total ?? invoice.value),
    };
};
const mapClientQuoteSummary = (quote) => ({
    id: quote.id,
    client_id: quote.client_id ?? '',
    consecutive: quote.consecutive ?? null,
    reference: quote.consecutive ?? quote.description ?? quote.id ?? null,
    description: quote.description ?? null,
    value: toNumber(quote.value),
    subtotal: toNumber(quote.subtotal ?? quote.value),
    tax_one: toNumber(quote.tax_one ?? 0),
    tax_two: toNumber(quote.tax_two ?? 0),
    total: toNumber(quote.total ?? quote.value),
    url: quote.url ?? null,
    created: quote.created ?? null,
    updated: quote.updated ?? null,
    status: mapQuoteStatus(quote.status),
    quote_detail: Array.isArray(quote.quote_detail)
        ? quote.quote_detail.map((detail) => ({
            ...detail,
            total_value: toNumber(detail.total_value),
        }))
        : [],
    invoice: mapInvoiceSummary(Array.isArray(quote.quote_attachment) ? quote.quote_attachment : []),
});
const mapClientQuoteDetail = (quote) => ({
    ...quote,
    value: toNumber(quote.value),
    status: mapQuoteStatus(quote.status),
    quote_detail: Array.isArray(quote.quote_detail)
        ? quote.quote_detail.map((detail) => ({
            ...detail,
            total_value: toNumber(detail.total_value),
        }))
        : [],
    invoice: mapInvoiceSummary(Array.isArray(quote.quote_attachment) ? quote.quote_attachment : []),
});
export async function listClientQuotesCtrl(req, res) {
    try {
        const clientId = req?.user?.empresaid;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        }
        const quotes = await listClientQuotes(clientId);
        const mapped = Array.isArray(quotes) ? quotes.map(mapClientQuoteSummary) : [];
        console.log('Mapped quotes:', mapped);
        return res.json({ success: true, data: { quotes: mapped } });
    }
    catch (error) {
        console.error('listClientQuotesCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible obtener las cotizaciones' });
    }
}
/**
 * POST /quotes
 * Envía una nueva cotización para el cliente autenticado
 */
export async function createClientQuoteCtrl(req, res) {
    try {
        const clientId = req?.user?.empresaid;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        }
        const parsed = parseClientQuotePayload(req.body);
        if ('error' in parsed) {
            return res.status(400).json({ success: false, message: parsed.error });
        }
        const createdQuote = await submitClientQuote(clientId, parsed.data);
        const mapped = mapClientQuoteDetail(createdQuote);
        return res
            .status(201)
            .json({ success: true, message: 'Cotización enviada correctamente', data: { quote: mapped } });
    }
    catch (error) {
        if (error instanceof QuoteValidationError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('createClientQuoteCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible enviar la cotización' });
    }
}
/**
 * GET /quotes/:id
 * Obtiene el detalle completo de una cotización específica
 */
export async function getClientQuoteDetailCtrl(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' });
        }
        const clientId = req?.user?.empresaid;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        }
        const quote = await fetchClientQuoteById(clientId, id);
        if (!quote) {
            return res.status(404).json({ success: false, message: 'Cotización no encontrada o no pertenece al cliente' });
        }
        return res.json({ success: true, data: { quote: mapClientQuoteDetail(quote) } });
    }
    catch (error) {
        console.error('getClientQuoteDetailCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible obtener el detalle de la cotización' });
    }
}
/**
 * POST /quotes/:id/generate-invoice
 * Genera una factura a partir de una cotización
 */
export async function generateInvoiceFromQuoteCtrl(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' });
        }
        const clientId = req?.user?.empresaid;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        }
        // Verificar que la cotización existe y pertenece al cliente
        const quote = await fetchClientQuoteById(clientId, id);
        if (!quote) {
            return res.status(404).json({ success: false, message: 'Cotización no encontrada o no pertenece al cliente' });
        }
        // Generar la factura
        const invoice = await generateInvoiceFromQuote(id, clientId);
        if (!invoice) {
            return res.status(500).json({ success: false, message: 'No fue posible generar la factura' });
        }
        return res.json({
            success: true,
            message: 'Factura generada exitosamente',
            data: { invoice }
        });
    }
    catch (error) {
        console.error('generateInvoiceFromQuoteCtrl error', error);
        return res.status(500).json({ success: false, message: 'Error al generar la factura desde la cotización' });
    }
}
/**
 * POST /quotes/:id/send-email
 * Envía una cotización por correo electrónico
 */
export async function sendClientQuoteEmailCtrl(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' });
        }
        const clientId = req?.user?.empresaid;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        }
        // Verificar que la cotización existe y pertenece al cliente
        const quote = await fetchClientQuoteById(clientId, id);
        if (!quote) {
            return res.status(404).json({ success: false, message: 'Cotización no encontrada o no pertenece al cliente' });
        }
        // Validar destinatarios
        const recipients = Array.isArray(req.body?.recipients) ? req.body.recipients : [];
        const normalizedRecipients = recipients
            .map((recipient) => (typeof recipient === 'string' ? recipient.trim() : ''))
            .filter((recipient) => recipient.length > 0);
        if (normalizedRecipients.length === 0) {
            return res.status(400).json({ success: false, message: 'Debe proporcionar al menos un destinatario válido' });
        }
        const message = typeof req.body?.message === 'string' ? req.body.message : undefined;
        // Por ahora, simulamos el envío (placeholder para integración SMTP real)
        const now = new Date();
        return res.json({
            success: true,
            message: 'Cotización enviada correctamente',
            data: {
                id: quote.id,
                subject: `Cotización ${quote.description ?? quote.id}`,
                recipients: normalizedRecipients,
                message: message ?? null,
                sentAt: now.toISOString(),
            }
        });
    }
    catch (error) {
        console.error('sendClientQuoteEmailCtrl error', error);
        return res.status(500).json({ success: false, message: 'Error al enviar la cotización por correo' });
    }
}
/**
 * ================================
 * COMENTARIOS (CLIENTE)
 * ================================
 */
export async function createCommentCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' });
    }
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'El contenido del comentario es requerido' });
    }
    try {
        const clientId = req?.user?.empresaid;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        }
        const userId = req?.user?.id;
        const payload = {
            quoteId: id,
            content: content.trim(),
            userId: userId ?? null,
        };
        const comment = await createComment(clientId, payload);
        return res.status(201).json({ success: true, data: comment });
    }
    catch (error) {
        console.error('createCommentCtrl error', error);
        if (error instanceof QuoteValidationError || error instanceof QuoteNotFoundError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'No fue posible crear el comentario' });
    }
}
export async function updateCommentCtrl(req, res) {
    const { commentId } = req.params;
    if (!commentId) {
        return res.status(400).json({ success: false, message: 'Falta el identificador del comentario' });
    }
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'El contenido del comentario es requerido' });
    }
    try {
        const clientId = req?.user?.empresaid;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        }
        const payload = { content: content.trim() };
        const comment = await updateComment(clientId, commentId, payload);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comentario no encontrado' });
        }
        return res.json({ success: true, data: comment });
    }
    catch (error) {
        console.error('updateCommentCtrl error', error);
        if (error instanceof QuoteValidationError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'No fue posible actualizar el comentario' });
    }
}
export async function deleteCommentCtrl(req, res) {
    const { commentId } = req.params;
    if (!commentId) {
        return res.status(400).json({ success: false, message: 'Falta el identificador del comentario' });
    }
    try {
        const clientId = req?.user?.empresaid;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        }
        await deleteComment(clientId, commentId);
        return res.status(204).send();
    }
    catch (error) {
        console.error('deleteCommentCtrl error', error);
        if (error instanceof QuoteNotFoundError) {
            return res.status(404).json({ success: false, message: 'Comentario no encontrado' });
        }
        return res.status(500).json({ success: false, message: 'No fue posible eliminar el comentario' });
    }
}
export async function listCommentsByQuoteCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' });
    }
    try {
        const clientId = req?.user?.empresaid;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        }
        const comments = await listCommentsByQuote(clientId, id);
        return res.json({ success: true, data: comments });
    }
    catch (error) {
        console.error('listCommentsByQuoteCtrl error', error);
        if (error instanceof QuoteNotFoundError) {
            return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
        }
        return res.status(500).json({ success: false, message: 'No fue posible obtener los comentarios' });
    }
}
/**
 * ================================
 * APROBAR COTIZACIÓN (CLIENTE)
 * ================================
 */
export async function approveQuoteCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' });
    }
    try {
        const clientId = req?.user?.empresaid;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        }
        const result = await approveQuote(clientId, id);
        return res.json({ success: true, message: 'Cotización aprobada exitosamente', data: result });
    }
    catch (error) {
        console.error('approveQuoteCtrl error', error);
        if (error instanceof QuoteNotFoundError) {
            return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
        }
        if (error instanceof QuoteValidationError) {
            return res.status(400).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'No fue posible aprobar la cotización' });
    }
}
