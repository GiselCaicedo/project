import { prisma } from '../../../config/db.js';
import { parseServicePayload } from '../../admin/controllers/serviceController.js';
import { updateService } from '../../admin/services/serviceService.js';
import { listClientServices, fetchClientServiceById } from '../services/serviceService.js';
export async function listClientServicesCtrl(req, res) {
    try {
        const clientId = req?.user?.empresaid;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        }
        const services = await listClientServices(clientId);
        return res.json({ success: true, data: { services } });
    }
    catch (error) {
        console.error('listClientServicesCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible obtener los servicios' });
    }
}
export async function getClientServiceDetailCtrl(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Falta el identificador del servicio' });
        }
        const clientId = req?.user?.empresaid;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        }
        const service = await fetchClientServiceById(clientId, id);
        if (!service) {
            return res.status(404).json({ success: false, message: 'Servicio no encontrado o no asignado al cliente' });
        }
        return res.json({ success: true, data: { service } });
    }
    catch (error) {
        console.error('getClientServiceDetailCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible obtener el detalle del servicio' });
    }
}
export async function updateClientServiceCtrl(req, res) {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta el identificador del servicio' });
    }
    const clientId = req?.user?.empresaid;
    if (!clientId) {
        return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
    }
    const assignment = await prisma.client_service.findFirst({
        where: { client_id: clientId, service_id: id },
        select: { id: true },
    });
    if (!assignment) {
        return res.status(403).json({ success: false, message: 'El servicio no está asignado al cliente' });
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
        console.error('updateClientServiceCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible actualizar el servicio' });
    }
}
