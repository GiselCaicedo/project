import type { Request, Response } from 'express'
import { prisma } from '../../../config/db.js'
import { parseServicePayload } from '../../admin/controllers/serviceController.js'
import { updateService } from '../../admin/services/serviceService.js'
import { listClientServices, fetchClientServiceById } from '../services/serviceService.js'

export async function listClientServicesCtrl(req: Request, res: Response) {
  try {
    const clientId = (req as any)?.user?.empresaid as string | undefined

    console.log('Client ID from token:', clientId);
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Falta empresa en el token' })
    }

    const services = await listClientServices(clientId)
    return res.json({ success: true, data: { services } })
  } catch (error) {
    console.error('listClientServicesCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible obtener los servicios' })
  }
}

export async function getClientServiceDetailCtrl(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ success: false, message: 'Falta el identificador del servicio' })
    }

    const clientId = (req as any)?.user?.empresaid as string | undefined
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Falta empresa en el token' })
    }

    const service = await fetchClientServiceById(clientId, id)
    if (!service) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado o no asignado al cliente' })
    }

    return res.json({ success: true, data: { service } })
  } catch (error) {
    console.error('getClientServiceDetailCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible obtener el detalle del servicio' })
  }
}



export async function listClientServiceObservationsCtrl(req: Request, res: Response) {
  try {
    const { id } = req.params as { id?: string }
    if (!id) {
      return res.status(400).json({ success: false, message: 'Falta el identificador del servicio' })
    }

    const clientId = (req as any)?.user?.empresaid as string | undefined
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Falta empresa en el token' })
    }

    const isUuid = (v: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v.trim())
    if (!isUuid(clientId) || !isUuid(id)) {
      return res.json({ success: true, data: [] })
    }

    // Validar pertenencia buscando la asignación
    const assignment = await prisma.client_service.findFirst({ where: { client_id: clientId, service_id: id } })
    if (!assignment) {
      return res.json({ success: true, data: [] })
    }

    const rows = await prisma.service_observation.findMany({
      where: { client_service_id: assignment.id, status: { not: false } },
      orderBy: { created: 'desc' },
    })

    const toIso = (d: any) => (d instanceof Date ? d.toISOString() : d ? new Date(d).toISOString() : null)
    const observations = rows.map((r) => ({ id: r.id, content: r.content, created: toIso(r.created), updated: toIso(r.updated) }))
    return res.json({ success: true, data: observations })
  } catch (error) {
    console.error('listClientServiceObservationsCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible obtener las observaciones' })
  }
}
