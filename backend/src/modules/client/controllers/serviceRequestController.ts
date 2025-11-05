import type { Request, Response } from 'express'
import { createClientServiceRequest, listClientServiceRequests } from '../services/serviceRequestService.js'

export async function listClientServiceRequestsCtrl(req: Request, res: Response) {
  try {
    const clientId = (req as any)?.user?.empresaid as string | undefined
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Cliente no definido en la sesión' })
    }
    const requests = await listClientServiceRequests(clientId)
    return res.json({ success: true, data: { requests } })
  } catch (error) {
    console.error('listClientServiceRequestsCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible obtener tus solicitudes' })
  }
}

export async function createClientServiceRequestCtrl(req: Request, res: Response) {
  try {
    const clientId = (req as any)?.user?.empresaid as string | undefined
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Cliente no definido en la sesión' })
    }

    const serviceIdRaw = req.body?.serviceId
    const descriptionRaw = req.body?.description

    const serviceId = typeof serviceIdRaw === 'string' ? serviceIdRaw.trim() : ''
    const description = typeof descriptionRaw === 'string' ? descriptionRaw.trim() : null

    if (!serviceId) {
      return res.status(400).json({ success: false, message: 'Falta el servicio' })
    }

    const request = await createClientServiceRequest({ clientId, serviceId, description })
    return res.status(201).json({ success: true, data: { request } })
  } catch (error) {
    console.error('createClientServiceRequestCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible crear la solicitud' })
  }
}

