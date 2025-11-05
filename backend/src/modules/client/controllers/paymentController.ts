import type { Request, Response } from 'express'
import {
  listClientPayments,
  fetchClientPaymentById,
  createPayment,
  listPaymentMethods,
  listClientInvoicesForPayment,
  type CreatePaymentPayload,
} from '../services/paymentService.js'
import { saveBase64File } from '../../../utils/fileStorage.js'

type ParsedAttachment = {
  id?: string
  url: string
  invoiceId?: string | null
}

const parseAttachments = async (value: unknown): Promise<ParsedAttachment[]> => {
  if (!Array.isArray(value)) return []

  const processed = await Promise.all(
    value.map(async (entry) => {
      const id = typeof entry?.id === 'string' ? entry.id : undefined
      let url = typeof entry?.url === 'string' ? entry.url.trim() : ''
      const invoiceId = typeof entry?.invoiceId === 'string' ? entry.invoiceId.trim() : null
      const isFile = entry?.isFile === true

      // If it's a file (base64), save it and get the URL
      if (isFile && url.startsWith('data:')) {
        try {
          const fileName = typeof entry?.fileName === 'string' ? entry.fileName : 'attachment'
          const fileType = typeof entry?.fileType === 'string' ? entry.fileType : null
          const savedUrl = await saveBase64File(
            { name: fileName, type: fileType, data: url },
            { folder: 'payments' }
          )
          url = savedUrl
        } catch (error) {
          console.error('Error saving attachment file:', error)
          return null
        }
      }

      return { id, url, invoiceId }
    })
  )

  return processed.filter((attachment) =>
    attachment !== null && attachment.url.length > 0
  ) as ParsedAttachment[]
}

const parseBoolean = (value: unknown): boolean | null => {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return null
}

const buildPayload = async (body: any, clientId: string): Promise<{ data?: CreatePaymentPayload; error?: string }> => {
  const value = typeof body?.value === 'string' ? body.value.trim() : ''
  const status = typeof body?.status === 'string' ? body.status.trim() : null
  const methodId = typeof body?.methodId === 'string' ? body.methodId.trim() : null
  const methodName = typeof body?.methodName === 'string' ? body.methodName.trim() : null
  const receiptUrl = typeof body?.receiptUrl === 'string' ? body.receiptUrl.trim() : null
  const type = typeof body?.type === 'string' ? body.type.trim() : null
  const paidAt = typeof body?.paidAt === 'string' ? body.paidAt.trim() : null
  const confirmed = parseBoolean(body?.confirmed)
  const attachments = await parseAttachments(body?.attachments)

  if (!value) {
    return { error: 'El valor del pago es obligatorio' }
  }

  if (!methodId && !(methodName && methodName.length > 0)) {
    return { error: 'Debes seleccionar o ingresar un método de pago' }
  }

  const payload: CreatePaymentPayload = {
    clientId,
    value,
    status,
    methodId: methodId || undefined,
    methodName: methodName || undefined,
    receiptUrl,
    type,
    paidAt,
    confirmed,
    attachments,
  }

  return { data: payload }
}

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
 * GET /payments/methods
 * Obtiene todos los métodos de pago disponibles
 */
export async function listPaymentMethodsCtrl(_req: Request, res: Response) {
  try {
    const methods = await listPaymentMethods()
    return res.json({ success: true, data: { methods } })
  } catch (error) {
    console.error('listPaymentMethodsCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible obtener los métodos de pago' })
  }
}

/**
 * GET /payments/invoices
 * Obtiene las facturas del cliente para vincular al pago
 */
export async function listClientInvoicesCtrl(req: Request, res: Response) {
  try {
    const clientId = (req as any)?.user?.empresaid as string | undefined
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Falta empresa en el token' })
    }

    const invoices = await listClientInvoicesForPayment(clientId)
    return res.json({ success: true, data: { invoices } })
  } catch (error) {
    console.error('listClientInvoicesCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible obtener las facturas' })
  }
}

/**
 * POST /payments
 * Crea un nuevo pago con toda la información similar al admin
 */
export async function createPaymentCtrl(req: Request, res: Response) {
  try {
    const clientId = (req as any)?.user?.empresaid as string | undefined
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Falta empresa en el token' })
    }

    const parsed = await buildPayload(req.body, clientId)
    if (parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error })
    }

    const payment = await createPayment(parsed.data!)
    if (!payment) {
      return res.status(500).json({ success: false, message: 'No fue posible procesar el pago' })
    }

    return res.status(201).json({
      success: true,
      message: 'Pago creado exitosamente',
      data: { payment }
    })
  } catch (error) {
    console.error('createPaymentCtrl error', error)
    return res.status(500).json({ success: false, message: 'Error al procesar el pago' })
  }
}
