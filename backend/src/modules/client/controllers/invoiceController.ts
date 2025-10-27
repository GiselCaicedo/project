import type { Request, Response } from 'express'
import {
  listClientInvoices,
  fetchClientInvoiceById,
} from '../services/invoiceService.js'

/**
 * GET /invoices
 * Lista todas las facturas del cliente autenticado
 */
export async function listClientInvoicesCtrl(req: Request, res: Response) {
  try {
    const clientId = (req as any)?.user?.empresaid as string | undefined
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Falta empresa en el token' })
    }

    const invoices = await listClientInvoices(clientId)
    return res.json({ success: true, data: { invoices } })
  } catch (error) {
    console.error('listClientInvoicesCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible obtener las facturas' })
  }
}

/**
 * GET /invoices/:id
 * Obtiene el detalle completo de una factura específica
 */
export async function getClientInvoiceDetailCtrl(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ success: false, message: 'Falta el identificador de la factura' })
    }

    const clientId = (req as any)?.user?.empresaid as string | undefined
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Falta empresa en el token' })
    }

    const invoice = await fetchClientInvoiceById(clientId, id)
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Factura no encontrada o no pertenece al cliente' })
    }

    return res.json({ success: true, data: { invoice } })
  } catch (error) {
    console.error('getClientInvoiceDetailCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible obtener el detalle de la factura' })
  }
}
