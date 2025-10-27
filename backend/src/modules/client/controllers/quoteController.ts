import type { Request, Response } from 'express'
import {
  listClientQuotes,
  fetchClientQuoteById,
  generateInvoiceFromQuote,
  submitClientQuote,
  type SubmitClientQuoteInput,
} from '../services/quoteService.js'
import { QuoteValidationError, type QuoteServiceItemInput } from '../../admin/services/quoteService.js'

const parseAmount = (value: any): number | null | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      return null
    }
    const normalized = trimmed.replace(/[^0-9.,-]/g, '').replace(',', '.')
    const parsed = Number.parseFloat(normalized)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  if (value === null) {
    return null
  }
  return undefined
}

const parsePositiveQuantity = (value: any): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      return undefined
    }
    const normalized = trimmed.replace(/[^0-9.,-]/g, '').replace(',', '.')
    const parsed = Number.parseFloat(normalized)
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }
  return undefined
}

const parseClientQuoteServices = (value: any): QuoteServiceItemInput[] | { error: string } => {
  if (!Array.isArray(value) || value.length === 0) {
    return { error: 'Debe seleccionar al menos un servicio' }
  }

  const services: QuoteServiceItemInput[] = []

  for (const entry of value) {
    const serviceId = typeof entry?.serviceId === 'string' ? entry.serviceId.trim() : ''
    if (serviceId.length === 0) {
      return { error: 'Cada servicio debe incluir un identificador válido' }
    }

    const quantity = parsePositiveQuantity(entry?.quantity)
    if (typeof quantity === 'undefined') {
      return { error: `Cantidad inválida para el servicio ${serviceId}` }
    }

    const hasUnitPrice = Object.prototype.hasOwnProperty.call(entry ?? {}, 'unitPrice')
    const unitPrice = parseAmount(entry?.unitPrice)
    if (hasUnitPrice && typeof unitPrice === 'undefined') {
      return { error: `Precio unitario inválido para el servicio ${serviceId}` }
    }

    const hasTotal = Object.prototype.hasOwnProperty.call(entry ?? {}, 'total')
    const totalValue = parseAmount(entry?.total)
    if (hasTotal && typeof totalValue === 'undefined') {
      return { error: `Total inválido para el servicio ${serviceId}` }
    }

    const payload: QuoteServiceItemInput = {
      serviceId,
      quantity,
    }

    if (typeof unitPrice === 'number') {
      payload.unitPrice = unitPrice
    }

    if (typeof totalValue === 'number') {
      payload.total = totalValue
    }

    services.push(payload)
  }

  return services
}

const parseClientQuotePayload = (body: any): { data: SubmitClientQuoteInput } | { error: string } => {
  const servicesResult = parseClientQuoteServices(body?.services)
  if ('error' in servicesResult) {
    return servicesResult
  }

  const descriptionValue = typeof body?.description === 'string' ? body.description.trim() : undefined

  const payload: SubmitClientQuoteInput = {
    services: servicesResult,
  }

  if (typeof descriptionValue !== 'undefined') {
    payload.description = descriptionValue.length > 0 ? descriptionValue : null
  }

  return { data: payload }
}

type ClientQuoteStatus = 'pendiente' | 'aprobada' | 'rechazada'

const mapQuoteStatus = (status: any): ClientQuoteStatus => {
  if (status === true || status === 'aprobada') return 'aprobada'
  if (status === false || status === 'rechazada') return 'rechazada'
  return 'pendiente'
}

const toNumber = (value: any): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  if (typeof value === 'object' && value !== null && typeof value.valueOf === 'function') {
    const parsed = Number(value.valueOf())
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const mapInvoiceSummary = (attachments: any[]) => {
  const attachment = attachments.find((entry) => Boolean(entry.invoice_id))
  if (!attachment) {
    return null
  }

  const invoice = attachment.invoice ?? null
  return {
    id: attachment.invoice_id ?? null,
    number: invoice?.description ?? attachment.invoice_id ?? null,
    status: invoice?.status === true
      ? 'aprobada'
      : invoice?.status === false
        ? 'rechazada'
        : 'en_proceso',
    amount: invoice ? toNumber(invoice.value) : null,
  }
}

const mapClientQuoteSummary = (quote: any) => ({
  id: quote.id,
  client_id: quote.client_id ?? '',
  reference: quote.description ?? quote.id ?? null,
  description: quote.description ?? null,
  value: toNumber(quote.value),
  url: quote.url ?? null,
  created: quote.created ?? null,
  updated: quote.updated ?? null,
  status: mapQuoteStatus(quote.status),
  quote_detail: Array.isArray(quote.quote_detail)
    ? quote.quote_detail.map((detail: any) => ({
        ...detail,
        total_value: toNumber(detail.total_value),
      }))
    : [],
  invoice: mapInvoiceSummary(Array.isArray(quote.quote_attachment) ? quote.quote_attachment : []),
})

const mapClientQuoteDetail = (quote: any) => ({
  ...quote,
  value: toNumber(quote.value),
  status: mapQuoteStatus(quote.status),
  quote_detail: Array.isArray(quote.quote_detail)
    ? quote.quote_detail.map((detail: any) => ({
        ...detail,
        total_value: toNumber(detail.total_value),
      }))
    : [],
  invoice: mapInvoiceSummary(Array.isArray(quote.quote_attachment) ? quote.quote_attachment : []),
})

/**
 * GET /quotes
 * Lista todas las cotizaciones del cliente autenticado
 */
export async function listClientQuotesCtrl(req: Request, res: Response) {
  try {
    const clientId = (req as any)?.user?.empresaid as string | undefined
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Falta empresa en el token' })
    }

    const quotes = await listClientQuotes(clientId)
    const mapped = Array.isArray(quotes) ? quotes.map(mapClientQuoteSummary) : []
    return res.json({ success: true, data: { quotes: mapped } })
  } catch (error) {
    console.error('listClientQuotesCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible obtener las cotizaciones' })
  }
}

/**
 * POST /quotes
 * Envía una nueva cotización para el cliente autenticado
 */
export async function createClientQuoteCtrl(req: Request, res: Response) {
  try {
    const clientId = (req as any)?.user?.empresaid as string | undefined
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Falta empresa en el token' })
    }

    const parsed = parseClientQuotePayload(req.body)
    if ('error' in parsed) {
      return res.status(400).json({ success: false, message: parsed.error })
    }

    const createdQuote = await submitClientQuote(clientId, parsed.data)
    const mapped = mapClientQuoteDetail(createdQuote)
    return res
      .status(201)
      .json({ success: true, message: 'Cotización enviada correctamente', data: { quote: mapped } })
  } catch (error) {
    if (error instanceof QuoteValidationError) {
      return res.status(400).json({ success: false, message: error.message })
    }
    console.error('createClientQuoteCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible enviar la cotización' })
  }
}

/**
 * GET /quotes/:id
 * Obtiene el detalle completo de una cotización específica
 */
export async function getClientQuoteDetailCtrl(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' })
    }

    const clientId = (req as any)?.user?.empresaid as string | undefined
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Falta empresa en el token' })
    }

    const quote = await fetchClientQuoteById(clientId, id)
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada o no pertenece al cliente' })
    }

    return res.json({ success: true, data: { quote: mapClientQuoteDetail(quote) } })
  } catch (error) {
    console.error('getClientQuoteDetailCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible obtener el detalle de la cotización' })
  }
}

/**
 * POST /quotes/:id/generate-invoice
 * Genera una factura a partir de una cotización
 */
export async function generateInvoiceFromQuoteCtrl(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' })
    }

    const clientId = (req as any)?.user?.empresaid as string | undefined
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Falta empresa en el token' })
    }

    // Verificar que la cotización existe y pertenece al cliente
    const quote = await fetchClientQuoteById(clientId, id)
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada o no pertenece al cliente' })
    }

    // Generar la factura
    const invoice = await generateInvoiceFromQuote(id, clientId)
    if (!invoice) {
      return res.status(500).json({ success: false, message: 'No fue posible generar la factura' })
    }

    return res.json({
      success: true,
      message: 'Factura generada exitosamente',
      data: { invoice }
    })
  } catch (error) {
    console.error('generateInvoiceFromQuoteCtrl error', error)
    return res.status(500).json({ success: false, message: 'Error al generar la factura desde la cotización' })
  }
}

/**
 * POST /quotes/:id/send-email
 * Envía una cotización por correo electrónico
 */
export async function sendClientQuoteEmailCtrl(req: Request, res: Response) {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' })
    }

    const clientId = (req as any)?.user?.empresaid as string | undefined
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Falta empresa en el token' })
    }

    // Verificar que la cotización existe y pertenece al cliente
    const quote = await fetchClientQuoteById(clientId, id)
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada o no pertenece al cliente' })
    }

    // Validar destinatarios
    const recipients = Array.isArray(req.body?.recipients) ? req.body.recipients : []
    const normalizedRecipients = recipients
      .map((recipient: any) => (typeof recipient === 'string' ? recipient.trim() : ''))
      .filter((recipient: string) => recipient.length > 0)

    if (normalizedRecipients.length === 0) {
      return res.status(400).json({ success: false, message: 'Debe proporcionar al menos un destinatario válido' })
    }

    const message = typeof req.body?.message === 'string' ? req.body.message : undefined

    // Por ahora, simulamos el envío (placeholder para integración SMTP real)
    const now = new Date()

    return res.json({
      success: true,
      message: 'Cotización enviada correctamente',
      data: {
        id: quote.id,
        subject: `Cotización ${quote.description ?? quote.id}`,
        recipients: normalizedRecipients,
        message: message ?? null,
        sentAt: now.toISOString(),
      }
    })
  } catch (error) {
    console.error('sendClientQuoteEmailCtrl error', error)
    return res.status(500).json({ success: false, message: 'Error al enviar la cotización por correo' })
  }
}
