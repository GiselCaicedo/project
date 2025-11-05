import type { Request, Response } from 'express'
import { listServiceRequests, updateServiceRequest } from '../services/serviceRequestService.js'
import { validate as uuidValidate } from 'uuid'

export async function listServiceRequestsCtrl(_req: Request, res: Response) {
  try {
    const requests = await listServiceRequests()
    return res.json({ success: true, data: { requests } })
  } catch (error) {
    console.error('listServiceRequestsCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible obtener las solicitudes de servicios' })
  }
}

export async function updateServiceRequestCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador de la solicitud' })
  }
  if (!uuidValidate(id)) {
    return res.status(400).json({ success: false, message: 'Identificador de solicitud inválido' })
  }

  const status = String(req.body?.status ?? '').toLowerCase()
  const notesRaw = req.body?.notes
  const notes = typeof notesRaw === 'string' ? notesRaw.trim() : null

  if (status !== 'abierto' && status !== 'proceso' && status !== 'cerrado') {
    return res.status(400).json({ success: false, message: 'Estado inválido. Debe ser: abierto, proceso o cerrado' })
  }

  try {
    const userId = (req as any)?.user?.id as string | undefined
    const request = await updateServiceRequest(id, status as 'abierto' | 'proceso' | 'cerrado', {
      reviewerId: userId ?? null,
      notes,
    })
    if (!request) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada' })
    }
    return res.json({ success: true, data: { request } })
  } catch (error) {
    console.error('updateServiceRequestCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible actualizar la solicitud' })
  }
}

