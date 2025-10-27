import { convertQuoteToInvoice, generateQuotePdf, getQuoteById, listQuotes, sendQuoteByEmail, updateQuote, } from '../services/quoteService.js';
export async function listQuotesCtrl(_req, res) {
    const data = await listQuotes();
    res.json({ success: true, data });
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
        return res.status(500).json({ success: false, message: 'No fue posible actualizar la cotización' });
    }
}
