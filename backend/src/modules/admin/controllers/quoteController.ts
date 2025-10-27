import type { Request, Response } from 'express'
import {
  convertQuoteToInvoice,
  createQuote,
  deleteQuote,
  generateQuotePdf,
  getQuoteById,
  listQuotes,
  sendQuoteByEmail,
  updateQuote,
  QuoteAlreadyInvoicedError,
  QuoteNotFoundError,
  QuoteValidationError,
  type CreateQuoteInput,
  type QuoteServiceItemInput,
  type QuoteStatusLabel,
  type SendQuoteEmailPayload,
  type UpdateQuoteInput,
} from '../services/quoteService.js'

export async function listQuotesCtrl(_req: Request, res: Response) {
  const data = await listQuotes()
  res.json({ success: true, data })
}

export async function createQuoteCtrl(req: Request, res: Response) {
  const parsed = parseQuoteCreatePayload(req.body)
  if ('error' in parsed) {
    return res.status(400).json({ success: false, message: parsed.error })
  }

  try {
    const quote = await createQuote(parsed.data)
    return res.status(201).json({ success: true, data: quote })
  } catch (error) {
    console.error('createQuoteCtrl error', error)
    if (error instanceof QuoteValidationError) {
      return res.status(400).json({ success: false, message: error.message })
    }
    return res.status(500).json({ success: false, message: 'No fue posible crear la cotización' })
  }
}

export async function getQuoteByIdCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' })
  }

  const quote = await getQuoteById(id)
  if (!quote) {
    return res.status(404).json({ success: false, message: 'Cotización no encontrada' })
  }

  return res.json({ success: true, data: quote })
}

export async function generateQuotePdfCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' })
  }

  try {
    const payload = await generateQuotePdf(id)
    if (!payload) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada' })
    }
    return res.json({ success: true, data: payload })
  } catch (error) {
    console.error('generateQuotePdfCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible generar el PDF de la cotización' })
  }
}

const parseSendQuotePayload = (body: any): SendQuoteEmailPayload | { error: string } => {
  const recipients = Array.isArray(body?.recipients) ? body.recipients : []
  const normalized = recipients
    .map((recipient) => (typeof recipient === 'string' ? recipient.trim() : ''))
    .filter((recipient) => recipient.length > 0)

  if (normalized.length === 0) {
    return { error: 'Debe indicar al menos un destinatario' }
  }

  const message = typeof body?.message === 'string' ? body.message : undefined
  return { recipients: normalized, message }
}

export async function sendQuoteEmailCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' })
  }

  const payload = parseSendQuotePayload(req.body)
  if ('error' in payload) {
    return res.status(400).json({ success: false, message: payload.error })
  }

  try {
    const result = await sendQuoteByEmail(id, payload)
    if (!result) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada' })
    }
    return res.json({ success: true, data: result })
  } catch (error) {
    console.error('sendQuoteEmailCtrl error', error)
    const message = error instanceof Error ? error.message : 'No fue posible enviar la cotización'
    return res.status(400).json({ success: false, message })
  }
}

export async function convertQuoteToInvoiceCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' })
  }

  try {
    const payload = await convertQuoteToInvoice(id)
    if (!payload) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada' })
    }

    if (payload.alreadyConverted) {
      return res.status(200).json({ success: true, data: payload })
    }

    return res.status(201).json({ success: true, data: payload })
  } catch (error) {
    console.error('convertQuoteToInvoiceCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible convertir la cotización en factura' })
  }
}

const QUOTE_STATUSES: QuoteStatusLabel[] = ['pendiente', 'aprobada', 'rechazada']

const isQuoteStatus = (value: unknown): value is QuoteStatusLabel =>
  typeof value === 'string' && QUOTE_STATUSES.includes(value as QuoteStatusLabel)

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
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : undefined
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      return undefined
    }
    const normalized = trimmed.replace(/[^0-9.,-]/g, '').replace(',', '.')
    const parsed = Number.parseFloat(normalized)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return undefined
    }
    return parsed
  }
  return undefined
}

const parseOptionalDateInput = (value: any): Date | undefined => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
      return undefined
    }
    const parsed = new Date(trimmed)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }
  return undefined
}

const parseQuoteServicesPayload = (
  value: any,
): QuoteServiceItemInput[] | { error: string } => {
  if (!Array.isArray(value) || value.length === 0) {
    return { error: 'Debe asociar al menos un servicio a la cotización' }
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
    const unitPriceValue = parseAmount(entry?.unitPrice)
    if (hasUnitPrice && typeof unitPriceValue === 'undefined') {
      return { error: `Precio unitario inválido para el servicio ${serviceId}` }
    }

    const hasTotal = Object.prototype.hasOwnProperty.call(entry ?? {}, 'total')
    const totalValue = parseAmount(entry?.total)
    if (hasTotal && typeof totalValue === 'undefined') {
      return { error: `Total inválido para el servicio ${serviceId}` }
    }

    const servicePayload: QuoteServiceItemInput = {
      serviceId,
      quantity,
    }

    if (typeof unitPriceValue === 'number') {
      servicePayload.unitPrice = unitPriceValue
    }

    if (typeof totalValue === 'number') {
      servicePayload.total = totalValue
    }

    services.push(servicePayload)
  }

  return services
}

const parseQuoteCreatePayload = (body: any): { data: CreateQuoteInput } | { error: string } => {
  const clientId = typeof body?.clientId === 'string' ? body.clientId.trim() : ''
  if (clientId.length === 0) {
    return { error: 'Debe indicar el cliente de la cotización' }
  }

  const servicesResult = parseQuoteServicesPayload(body?.services)
  if ('error' in servicesResult) {
    return servicesResult
  }

  const descriptionValue = typeof body?.description === 'string' ? body.description.trim() : undefined
  const issuedAtValue = parseOptionalDateInput(body?.issuedAt)

  const payload: CreateQuoteInput = {
    clientId,
    services: servicesResult,
  }

  if (typeof descriptionValue !== 'undefined') {
    payload.description = descriptionValue.length > 0 ? descriptionValue : null
  }

  if (issuedAtValue) {
    payload.issuedAt = issuedAtValue
  }

  return { data: payload }
}

const parseQuoteUpdatePayload = (body: any): { data: UpdateQuoteInput } | { error: string } => {
  const descriptionValue = typeof body?.description === 'string' ? body.description.trim() : undefined
  const statusValue = isQuoteStatus(body?.status) ? (body.status as QuoteStatusLabel) : undefined
  const amountValue = parseAmount(body?.amount)
  const urlValue = typeof body?.url === 'string' ? body.url.trim() : undefined

  if (
    typeof descriptionValue === 'undefined'
    && typeof statusValue === 'undefined'
    && typeof amountValue === 'undefined'
    && typeof urlValue === 'undefined'
  ) {
    return { error: 'Debe proporcionar información para actualizar la cotización' }
  }

  const payload: UpdateQuoteInput = {}

  if (typeof descriptionValue !== 'undefined') {
    payload.description = descriptionValue.length > 0 ? descriptionValue : null
  }

  if (typeof statusValue !== 'undefined') {
    payload.status = statusValue
  }

  if (typeof amountValue !== 'undefined') {
    payload.amount = amountValue
  }

  if (typeof urlValue !== 'undefined') {
    payload.url = urlValue.length > 0 ? urlValue : null
  }

  return { data: payload }
}

export async function updateQuoteCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' })
  }

  const parsed = parseQuoteUpdatePayload(req.body)
  if ('error' in parsed) {
    return res.status(400).json({ success: false, message: parsed.error })
  }

  try {
    const quote = await updateQuote(id, parsed.data)
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada' })
    }
    return res.json({ success: true, data: quote })
  } catch (error) {
    console.error('updateQuoteCtrl error', error)
    if (error instanceof QuoteAlreadyInvoicedError) {
      return res.status(409).json({ success: false, message: error.message })
    }
    if (error instanceof QuoteValidationError) {
      return res.status(400).json({ success: false, message: error.message })
    }
    return res.status(500).json({ success: false, message: 'No fue posible actualizar la cotización' })
  }
}

export async function deleteQuoteCtrl(req: Request, res: Response) {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ success: false, message: 'Falta el identificador de la cotización' })
  }

  try {
    await deleteQuote(id)
    return res.status(204).send()
  } catch (error) {
    if (error instanceof QuoteNotFoundError) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada' })
    }
    if (error instanceof QuoteAlreadyInvoicedError) {
      return res.status(409).json({ success: false, message: error.message })
    }
    console.error('deleteQuoteCtrl error', error)
    return res.status(500).json({ success: false, message: 'No fue posible eliminar la cotización' })
  }
}
