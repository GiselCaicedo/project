import { listClientInvoices, fetchClientInvoiceById, deleteClientInvoice, generateClientInvoiceArtifact, listClientInvoiceObservations, listClientInvoiceComments, createClientInvoiceComment, updateClientInvoiceComment, deleteClientInvoiceComment, } from '../services/invoiceService.js';
import { saveBase64File } from '../../../utils/fileStorage.js';
export async function listClientInvoicesCtrl(req, res) {
    try {
        const clientId = req?.user?.empresaid;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        }
        const invoices = await listClientInvoices(clientId);
        console.log(invoices);
        return res.json({ success: true, data: { invoices } });
    }
    catch (error) {
        console.error('listClientInvoicesCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible obtener las facturas' });
    }
}
export async function getClientInvoiceDetailCtrl(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Falta el identificador de la factura' });
        }
        const clientId = req?.user?.empresaid;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        }
        const invoice = await fetchClientInvoiceById(clientId, id);
        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Factura no encontrada o no pertenece al cliente' });
        }
        return res.json({ success: true, data: { invoice } });
    }
    catch (error) {
        console.error('getClientInvoiceDetailCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible obtener el detalle de la factura' });
    }
}
export async function deleteClientInvoiceCtrl(req, res) {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ success: false, message: 'Falta el identificador de la factura' });
        const clientId = req?.user?.empresaid;
        if (!clientId)
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        const ok = await deleteClientInvoice(clientId, id);
        if (!ok) {
            return res.status(404).json({ success: false, message: 'Factura no encontrada o no pertenece al cliente' });
        }
        return res.status(204).send();
    }
    catch (error) {
        console.error('deleteClientInvoiceCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible eliminar la factura' });
    }
}
export async function downloadClientInvoiceArtifactCtrl(req, res) {
    try {
        const { id, format } = req.params;
        if (!id)
            return res.status(400).json({ success: false, message: 'Falta factura' });
        const allowed = ['pdf', 'xml', 'zip'];
        const normalized = (format ?? '').toLowerCase();
        if (!allowed.includes(normalized))
            return res.status(400).json({ success: false, message: 'Formato inválido' });
        const clientId = req?.user?.empresaid;
        if (!clientId)
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        const artifact = await generateClientInvoiceArtifact(clientId, id, normalized);
        res.setHeader('Content-Type', artifact.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${artifact.filename}"`);
        return res.send(artifact.content);
    }
    catch (error) {
        console.error('downloadClientInvoiceArtifactCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible descargar el documento' });
    }
}
export async function listClientInvoiceObservationsCtrl(req, res) {
    try {
        const { id } = req.params;
        const clientId = req?.user?.empresaid;
        if (!clientId)
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        const observations = await listClientInvoiceObservations(clientId, id);
        return res.json({ success: true, data: observations });
    }
    catch (error) {
        console.error('listClientInvoiceObservationsCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible obtener observaciones' });
    }
}
export async function listClientInvoiceCommentsCtrl(req, res) {
    try {
        const { id } = req.params;
        const clientId = req?.user?.empresaid;
        if (!clientId)
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        const comments = await listClientInvoiceComments(clientId, id);
        return res.json({ success: true, data: comments });
    }
    catch (error) {
        console.error('listClientInvoiceCommentsCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible obtener comentarios' });
    }
}
export async function createClientInvoiceCommentCtrl(req, res) {
    try {
        const { id } = req.params;
        const { content } = req.body ?? {};
        if (!id || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Datos inválidos' });
        }
        const clientId = req?.user?.empresaid;
        const userId = req?.user?.id;
        if (!clientId)
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        const comment = await createClientInvoiceComment(clientId, { invoiceId: id, userId: userId ?? null, content: content.trim() });
        return res.status(201).json({ success: true, data: comment });
    }
    catch (error) {
        console.error('createClientInvoiceCommentCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible crear el comentario' });
    }
}
export async function updateClientInvoiceCommentCtrl(req, res) {
    try {
        const { commentId } = req.params;
        const { content } = req.body ?? {};
        if (!commentId || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Datos inválidos' });
        }
        const clientId = req?.user?.empresaid;
        if (!clientId)
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        const updated = await updateClientInvoiceComment(clientId, commentId, { content: content.trim() });
        if (!updated)
            return res.status(404).json({ success: false, message: 'Comentario no encontrado' });
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        console.error('updateClientInvoiceCommentCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible actualizar el comentario' });
    }
}
export async function deleteClientInvoiceCommentCtrl(req, res) {
    try {
        const { commentId } = req.params;
        if (!commentId)
            return res.status(400).json({ success: false, message: 'Falta identificador del comentario' });
        const clientId = req?.user?.empresaid;
        if (!clientId)
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        const ok = await deleteClientInvoiceComment(clientId, commentId);
        if (!ok)
            return res.status(404).json({ success: false, message: 'Comentario no encontrado' });
        return res.status(204).send();
    }
    catch (error) {
        console.error('deleteClientInvoiceCommentCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible eliminar el comentario' });
    }
}
export async function reportClientInvoicePaymentCtrl(req, res) {
    try {
        const { id } = req.params;
        const clientId = req?.user?.empresaid;
        console.log('reportClientInvoicePaymentCtrl - clientId:', clientId, 'invoiceId:', id);
        if (!clientId)
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        if (!id)
            return res.status(400).json({ success: false, message: 'Falta factura' });
        console.log('req.body:', JSON.stringify(req.body).substring(0, 200));
        const file = typeof req.body?.documentFile === 'object' ? {
            name: String(req.body?.documentFile?.name ?? ''),
            data: String(req.body?.documentFile?.data ?? ''),
            type: typeof req.body?.documentFile?.type === 'string' ? req.body.documentFile.type : null,
        } : null;
        console.log('file parsed:', file ? { name: file.name, type: file.type, dataLength: file.data.length } : null);
        if (!file || !file.name || !file.data)
            return res.status(400).json({ success: false, message: 'Falta comprobante' });
        console.log('Guardando archivo...');
        const url = await saveBase64File(file, { folder: 'payments' });
        console.log('Archivo guardado en:', url);
        // Guardar attachment
        console.log('Guardando attachment en BD...');
        const created = await (await import('../services/invoiceService.js')).attachClientPaymentProof(clientId, id, url);
        console.log('Attachment guardado:', created);
        return res.status(201).json({ success: true, data: created });
    }
    catch (error) {
        console.error('reportClientInvoicePaymentCtrl error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
        return res.status(500).json({ success: false, message: 'No fue posible informar el pago' });
    }
}
