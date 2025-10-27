import type { Request, Response } from 'express'
import {
  listClientPayments,
  fetchClientPaymentById,
  createPayment,
} from '../services/paymentService.js'

/**
 * GET /payments
 * Lista todos los pagos del cliente autenticado
 */
export async function listClientPaymentsCtrl(req: Request, res: Response) {
  try {
    const clientId = (req as any)?.user?.empresaid as string | undefined
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Falta empresa en el token' })
    }

    const payments = await listClientPayments(clientId)
    return res.json({ success: true, data: { payments } })
  } catch (error) {
    console.error('listClientPaymentsCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible obtener los pagos' })
  }
}

/**
 * GET /payments/:id
 * Obtiene el detalle de un pago específico
 */
export async function getClientPaymentDetailCtrl(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ success: false, message: 'Falta el identificador del pago' })
    }

    const clientId = (req as any)?.user?.empresaid as string | undefined
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Falta empresa en el token' })
    }

    const payment = await fetchClientPaymentById(clientId, id)
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Pago no encontrado o no pertenece al cliente' })
    }

    return res.json({ success: true, data: { payment } })
  } catch (error) {
    console.error('getClientPaymentDetailCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible obtener el detalle del pago' })
  }
}

/**
 * POST /payments/process
 * Procesa un nuevo pago
 */
export async function createPaymentCtrl(req: Request, res: Response) {
  try {
    const clientId = (req as any)?.user?.empresaid as string | undefined
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Falta empresa en el token' })
    }

    const { payment_method_id, value, type, code, url } = req.body

    // Validaciones básicas
    if (!payment_method_id) {
      return res.status(400).json({ success: false, message: 'Falta el método de pago' })
    }
    if (!value || parseFloat(value) <= 0) {
      return res.status(400).json({ success: false, message: 'El valor del pago debe ser mayor a 0' })
    }

    const paymentData = {
      client_id: clientId,
      payment_method_id,
      value: value.toString(),
      type: type || 'manual',
      code: code || null,
      url: url || null,
    }

    const payment = await createPayment(paymentData)
    if (!payment) {
      return res.status(500).json({ success: false, message: 'No fue posible procesar el pago' })
    }

    return res.status(201).json({
      success: true,
      message: 'Pago procesado exitosamente',
      data: { payment }
    })
  } catch (error) {
    console.error('createPaymentCtrl error', error)
    return res.status(500).json({ success: false, message: 'Error al procesar el pago' })
  }
}
