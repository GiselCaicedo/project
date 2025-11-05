import { validate as uuidValidate } from 'uuid';
import { createService, deleteService, fetchServiceById, fetchServiceCategories, listServices, ServiceHasAssignmentsError, updateService, } from '../services/serviceService.js';
const isServiceStatus = (value) => value === 'active' || value === 'inactive';
const sanitizeOptionalText = (value) => {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};
const parseDecimal = (value) => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    if (typeof value === 'string') {
        const normalized = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
        if (normalized.length === 0)
            return null;
        const parsed = Number.parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : null;
    }
    if (value === null)
        return null;
    return null;
};
const parseDateInput = (value) => {
    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = new Date(value);
        return Number.isFinite(parsed.getTime()) ? parsed : null;
    }
    if (value instanceof Date) {
        return Number.isFinite(value.getTime()) ? value : null;
    }
    return null;
};
export const parseServicePayload = (body) => {
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const status = isServiceStatus(body?.status) ? body.status : 'active';
    const description = sanitizeOptionalText(body?.description);
    const unit = sanitizeOptionalText(body?.unit);
    const categoryId = sanitizeOptionalText(body?.categoryId);
    const price = parseDecimal(body?.price);
    const subtotal = parseDecimal(body?.subtotal);
    const frequency = sanitizeOptionalText(body?.frequency);
    const startDate = parseDateInput(body?.startDate);
    const endDate = parseDateInput(body?.endDate);
    const taxOneId = sanitizeOptionalText(body?.taxOneId);
    const taxTwoId = sanitizeOptionalText(body?.taxTwoId);
    if (name.length === 0) {
        return { error: 'El nombre del servicio es obligatorio' };
    }
    if (price === null) {
        return { error: 'El precio del servicio es obligatorio' };
    }
    return {
        data: {
            name,
            status,
            description,
            unit,
            categoryId,
            price,
            subtotal: subtotal ?? price,
            frequency,
            startDate,
            endDate,
            taxOneId,
            taxTwoId,
        },
    };
};
export async function listServicesCtrl(_req, res) {
    try {
        const [services, categories] = await Promise.all([listServices(), fetchServiceCategories()]);
        res.json({ success: true, data: { services, categories } });
    }
    catch (error) {
        console.error('listServicesCtrl error', error);
        res.status(500).json({ success: false, message: 'No fue posible obtener los servicios' });
    }
}
export async function getServiceByIdCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador del servicio' });
    }
    if (!uuidValidate(id)) {
        return res.status(400).json({ success: false, message: 'Identificador de servicio inválido' });
    }
    const service = await fetchServiceById(id);
    if (!service) {
        return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
    }
    return res.json({ success: true, data: { service } });
}
export async function createServiceCtrl(req, res) {
    const parsed = parseServicePayload(req.body);
    if ('error' in parsed) {
        return res.status(400).json({ success: false, message: parsed.error });
    }
    try {
        const service = await createService(parsed.data);
        return res.status(201).json({ success: true, data: { service } });
    }
    catch (error) {
        console.error('createServiceCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible crear el servicio' });
    }
}
export async function updateServiceCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador del servicio' });
    }
    if (!uuidValidate(id)) {
        return res.status(400).json({ success: false, message: 'Identificador de servicio inválido' });
    }
    const parsed = parseServicePayload(req.body);
    if ('error' in parsed) {
        return res.status(400).json({ success: false, message: parsed.error });
    }
    try {
        const service = await updateService(id, parsed.data);
        if (!service) {
            return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
        }
        return res.json({ success: true, data: { service } });
    }
    catch (error) {
        console.error('updateServiceCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible actualizar el servicio' });
    }
}
export async function deleteServiceCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador del servicio' });
    }
    if (!uuidValidate(id)) {
        return res.status(400).json({ success: false, message: 'Identificador de servicio inválido' });
    }
    try {
        await deleteService(id);
        return res.status(204).send();
    }
    catch (error) {
        if (error instanceof ServiceHasAssignmentsError) {
            return res.status(409).json({ success: false, message: error.message });
        }
        if (error instanceof Error && error.message === 'SERVICE_NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
        }
        console.error('deleteServiceCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible eliminar el servicio' });
    }
}
export async function listServiceCategoriesCtrl(_req, res) {
    try {
        const categories = await fetchServiceCategories();
        return res.json({ success: true, data: { categories } });
    }
    catch (error) {
        console.error('listServiceCategoriesCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible obtener las categorías de servicio' });
    }
}
