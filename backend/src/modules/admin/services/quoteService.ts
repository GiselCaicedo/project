import { randomUUID } from 'node:crypto'
import { prisma } from '../../../config/db.js'

export type QuoteStatusLabel = 'pendiente' | 'aprobada' | 'rechazada'

type QuoteActionType = 'pdf' | 'email' | 'invoice'

export type QuoteSummary = {
  id: string
  reference: string
  client: {
    id: string | null
    name: string
  }
  issuedAt: string | null
  updatedAt: string | null
  status: QuoteStatusLabel
  services: number
  amount: number
  pdfUrl: string | null
  invoice: QuoteInvoiceSummary | null
}

export type QuoteServiceEntry = {
  id: string
  serviceId: string | null
  serviceName: string
  quantity: number
  unit: string | null
  unitPrice: number
  total: number
  status: QuoteStatusLabel
}

export type QuoteAttachmentEntry = {
  id: string
  invoiceId: string | null
  invoiceNumber: string | null
  invoiceStatus: QuoteStatusLabel | 'en_proceso'
  invoiceAmount: number
  invoiceUrl: string | null
}

export type QuoteInvoiceSummary = {
  id: string | null
  number: string | null
  status: QuoteStatusLabel | 'en_proceso'
  amount: number | null
}

export type QuoteAction = {
  type: QuoteActionType
  label: string
  available: boolean
  url?: string | null
  disabledReason?: string | null
}

export type QuoteObservation = {
  id: string
  quoteId: string
  userId: string | null
  content: string
  created: string | null
  updated: string | null
  status: boolean | null
}

export type QuoteComment = {
  id: string
  quoteId: string
  userId: string | null
  content: string
  created: string | null
  updated: string | null
  status: boolean | null
}

export type QuoteDetail = {
  id: string
  reference: string
  description: string | null
  status: QuoteStatusLabel
  amount: number
  issuedAt: string | null
  updatedAt: string | null
  client: {
    id: string | null
    name: string
  }
  services: QuoteServiceEntry[]
  attachments: QuoteAttachmentEntry[]
  actions: QuoteAction[]
  observations: QuoteObservation[]
  comments: QuoteComment[]
}

const normalizeText = (value: unknown, fallback: string): string => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : fallback
  }
  return fallback
}

const toIso = (value: Date | string | null | undefined): string | null => {
  if (!value) return null
  if (value instanceof Date) {
    return value.toISOString()
  }
  const asDate = new Date(value)
  return Number.isNaN(asDate.getTime()) ? null : asDate.toISOString()
}

const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  if (typeof value === 'bigint') {
    return Number(value)
  }
  if (typeof value === 'object') {
    if (typeof value.toNumber === 'function') {
      try {
        const parsed = value.toNumber()
        return Number.isFinite(parsed) ? parsed : 0
      } catch {
        return 0
      }
    }
    if (typeof value.valueOf === 'function') {
      const parsed = Number(value.valueOf())
      return Number.isFinite(parsed) ? parsed : 0
    }
  }
  return 0
}

const mapQuoteStatus = (status: boolean | null | undefined): QuoteStatusLabel => {
  if (status === true) return 'aprobada'
  if (status === false) return 'rechazada'
  return 'pendiente'
}

const mapInvoiceStatus = (status: boolean | null | undefined): QuoteStatusLabel | 'en_proceso' => {
  if (status === true) return 'aprobada'
  if (status === false) return 'rechazada'
  return 'en_proceso'
}

const mapStatusFlag = (status: QuoteStatusLabel | null | undefined): boolean | null => {
  if (status === 'aprobada') return true
  if (status === 'rechazada') return false
  if (status === 'pendiente') return null
  return null
}

const formatCurrencyString = (value: number): string => value.toFixed(2)
const roundCurrencyValue = (value: number): number =>
  Number.isFinite(value) ? Number.parseFloat(value.toFixed(2)) : 0

export class QuoteValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'QuoteValidationError'
  }
}

export class QuoteNotFoundError extends Error {
  constructor(message = 'Cotización no encontrada') {
    super(message)
    this.name = 'QuoteNotFoundError'
  }
}

export class QuoteAlreadyInvoicedError extends Error {
  constructor(message = 'La cotización ya fue convertida en factura') {
    super(message)
    this.name = 'QuoteAlreadyInvoicedError'
  }
}

export type QuoteServiceItemInput = {
  serviceId: string
  quantity: number
  unitPrice?: number | null
  total?: number | null
}

export type CreateQuoteInput = {
  clientId: string
  description?: string | null
  issuedAt?: Date | null
  services: QuoteServiceItemInput[]
}

export type UpdateQuoteInput = {
  description?: string | null
  status?: QuoteStatusLabel | null
  amount?: number | null
  url?: string | null
}

export async function updateQuoteServices(
  id: string,
  services: QuoteServiceItemInput[],
): Promise<QuoteDetail | null> {
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      quote_attachment: true,
    },
  })

  if (!quote) {
    return null
  }

  const hasInvoice = (quote.quote_attachment ?? []).some((a: any) => Boolean(a.invoice_id))
  if (hasInvoice) {
    throw new QuoteAlreadyInvoicedError('La cotización ya cuenta con una factura y no puede editar servicios')
  }

  const { details, total } = await resolveQuoteServiceDetails(services)

  const now = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.quote_detail.deleteMany({ where: { quote_id: id } })

    if (details.length > 0) {
      await tx.quote.update({
        where: { id },
        data: {
          value: formatCurrencyString(total),
          updated: now,
          quote_detail: {
            createMany: {
              // En nested createMany, Prisma asigna la relación automáticamente
              data: details.map((detail, index) => ({
                id: randomUUID(),
                service_id: detail.serviceId,
                item: index + 1,
                quantity: detail.quantity,
                total_value: detail.total,
                created: now,
                updated: now,
                status: null,
              })),
            },
          },
        },
      })
    } else {
      await tx.quote.update({ where: { id }, data: { value: formatCurrencyString(0), updated: now } })
    }
  })

  return getQuoteById(id)
}

const computeQuoteTotal = (quote: {
  value: any
  quote_detail: Array<{ total_value: any }>
}): number => {
  const totalFromDetails = quote.quote_detail.reduce((sum, detail) => sum + toNumber(detail.total_value), 0)
  if (totalFromDetails > 0) {
    return totalFromDetails
  }
  return toNumber(quote.value)
}

type QuoteWithDetails = {
  id: string
  client_id: string | null
  description: string | null
  value: any
  url: string | null
  quote_detail: Array<{
    id: string
    service_id: string | null
    item: number | null
    quantity: number | null
    total_value: any
    status: boolean | null
  }>
}

type QuoteAttachmentWithInvoice = {
  id: string
  quote_id: string | null
  invoice_id: string | null
  invoice: {
    id: string
    description: string | null
    status: boolean | null
    value: any
    url: string | null
    created: Date | string | null
  } | null
}

type TxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>

const createInvoiceForQuote = async (
  tx: TxClient,
  quote: QuoteWithDetails,
  now: Date,
): Promise<QuoteAttachmentWithInvoice> => {
  const total = computeQuoteTotal({ value: quote.value, quote_detail: quote.quote_detail ?? [] })
  const invoiceId = randomUUID()

  const invoice = await tx.invoice.create({
    data: {
      id: invoiceId,
      client_id: quote.client_id,
      description: quote.description ?? `Factura generada desde la cotización ${quote.id}`,
      value: formatCurrencyString(total),
      url: quote.url,
      created: now,
      updated: now,
      status: false,
    },
  })

  const details = (quote.quote_detail ?? []).map((detail, index) => {
    const quantity =
      typeof detail.quantity === 'number' && Number.isFinite(detail.quantity) ? detail.quantity : 1
    const totalValue = toNumber(detail.total_value) || total

    return {
      id: randomUUID(),
      invoice_id: invoiceId,
      service_id: detail.service_id,
      item: detail.item ?? index + 1,
      quantity,
      total_value: totalValue,
      created: now,
      updated: now,
      status: typeof detail.status === 'boolean' ? detail.status : true,
    }
  })

  if (details.length > 0) {
    await tx.invoice_detail.createMany({ data: details })
  }

  const attachment = await tx.quote_attachment.create({
    data: {
      id: randomUUID(),
      quote_id: quote.id,
      invoice_id: invoiceId,
    },
    include: {
      invoice: true,
    },
  })

  return attachment as QuoteAttachmentWithInvoice
}

const resolveQuoteServiceDetails = async (services: QuoteServiceItemInput[]) => {
  if (!Array.isArray(services) || services.length === 0) {
    throw new QuoteValidationError('Debe asociar al menos un servicio a la cotización')
  }

  const normalized = services.map((service) => ({
    serviceId: typeof service.serviceId === 'string' ? service.serviceId.trim() : '',
    quantity: typeof service.quantity === 'number' && Number.isFinite(service.quantity) ? service.quantity : Number.NaN,
    unitPrice:
      typeof service.unitPrice === 'number' && Number.isFinite(service.unitPrice) ? service.unitPrice : null,
    total: typeof service.total === 'number' && Number.isFinite(service.total) ? service.total : null,
  }))

  if (
    normalized.some(
      (service) => service.serviceId.length === 0 || !Number.isFinite(service.quantity) || service.quantity <= 0,
    )
  ) {
    throw new QuoteValidationError('Cada servicio debe incluir un identificador y una cantidad válida')
  }

  const serviceIds = Array.from(new Set(normalized.map((service) => service.serviceId)))
  const serviceRecords = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, price: true, subtotal: true },
  })

  const foundIds = new Set(serviceRecords.map((service) => service.id))
  const missingIds = serviceIds.filter((id) => !foundIds.has(id))

  if (missingIds.length > 0) {
    throw new QuoteValidationError(`Los siguientes servicios no existen: ${missingIds.join(', ')}`)
  }

  const serviceMap = new Map(serviceRecords.map((service) => [service.id, service]))

  const details = normalized.map((entry) => {
    const service = serviceMap.get(entry.serviceId)
    if (!service) {
      throw new QuoteValidationError(`Servicio no encontrado: ${entry.serviceId}`)
    }

    const basePrice = toNumber(service.subtotal ?? service.price ?? null)
    const unitPrice = entry.unitPrice !== null ? entry.unitPrice : basePrice
    const totalValue = entry.total !== null ? entry.total : unitPrice * entry.quantity

    return {
      serviceId: entry.serviceId,
      quantity: entry.quantity,
      total: roundCurrencyValue(totalValue),
    }
  })

  const total = roundCurrencyValue(details.reduce((sum, detail) => sum + detail.total, 0))

  return { details, total }
}

export async function listQuotes(): Promise<QuoteSummary[]> {
  const records = await prisma.quote.findMany({
    include: {
      client: true,
      quote_detail: true,
      quote_attachment: {
        include: {
          invoice: true,
        },
      },
    },
    orderBy: {
      created: 'desc',
    },
  })

  return records.map((quote) => {
    const services = Array.isArray(quote.quote_detail) ? quote.quote_detail.length : 0
    const amount = computeQuoteTotal({ value: quote.value, quote_detail: quote.quote_detail ?? [] })

    const firstAttachment = (quote.quote_attachment ?? []).find((attachment) => Boolean(attachment.invoice_id)) ?? null
    const invoiceSummary: QuoteInvoiceSummary | null = firstAttachment
      ? {
        id: firstAttachment.invoice_id ?? null,
        number: firstAttachment.invoice
          ? normalizeText((firstAttachment.invoice as any).consecutive ?? firstAttachment.invoice.description ?? firstAttachment.invoice.id, firstAttachment.invoice.id)
          : firstAttachment.invoice_id ?? null,
        status: mapInvoiceStatus(firstAttachment.invoice?.status ?? null),
        amount: firstAttachment.invoice ? toNumber(firstAttachment.invoice.value) : null,
      }
      : null

    return {
      id: quote.id,
      reference: normalizeText((quote as any).consecutive ?? quote.description, quote.id),
      description: quote.description ?? null,
      client: {
        id: quote.client_id ?? null,
        name: quote.client ? normalizeText(quote.client.name, 'Cliente sin nombre') : 'Cliente sin nombre',
      },
      issuedAt: toIso(quote.created),
      updatedAt: toIso(quote.updated),
      status: mapQuoteStatus(quote.status ?? null),
      services,
      amount,
      pdfUrl: quote.url ?? null,
      invoice: invoiceSummary,
    }
  })
}

export async function createQuote(payload: CreateQuoteInput): Promise<QuoteDetail> {
  const clientId = typeof payload.clientId === 'string' ? payload.clientId.trim() : ''
  if (clientId.length === 0) {
    throw new QuoteValidationError('Debe indicar el cliente de la cotización')
  }

  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } })
  if (!client) {
    throw new QuoteValidationError('El cliente indicado no existe')
  }

  const { details, total } = await resolveQuoteServiceDetails(payload.services)

  const now = new Date()
  const issuedAt = payload.issuedAt instanceof Date && !Number.isNaN(payload.issuedAt.getTime()) ? payload.issuedAt : now
  const description = typeof payload.description === 'string' && payload.description.trim().length > 0
    ? payload.description.trim()
    : null

  const quoteId = randomUUID()

  await prisma.$transaction(async (tx) => {
    await tx.quote.create({
      data: {
        id: quoteId,
        client_id: clientId,
        description,
        value: formatCurrencyString(total),
        url: null,
        created: issuedAt,
        updated: now,
        status: null,
      },
    })

    if (details.length > 0) {
      await tx.quote_detail.createMany({
        data: details.map((detail, index) => ({
          id: randomUUID(),
          quote_id: quoteId,
          service_id: detail.serviceId,
          item: index + 1,
          quantity: detail.quantity,
          total_value: detail.total,
          created: now,
          updated: now,
          status: null,
        })),
      })
    }
  })

  const created = await getQuoteById(quoteId)
  if (!created) {
    throw new QuoteNotFoundError()
  }

  return created
}

export async function getQuoteById(id: string): Promise<QuoteDetail | null> {
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      client: true,
      quote_detail: {
        include: {
          service: true,
        },
      },
      quote_attachment: {
        include: {
          invoice: true,
        },
      },
      quote_observation: {
        where: { status: true },
        orderBy: { created: 'desc' },
      },
      quote_comment: {
        where: { status: true },
        orderBy: { created: 'desc' },
      },
    },
  })

  if (!quote) {
    return null
  }

  const services: QuoteServiceEntry[] = (quote.quote_detail ?? []).map((detail) => {
    const quantity = detail.quantity ?? 0
    const total = toNumber(detail.total_value)
    const unitPrice = quantity > 0 ? total / quantity : 0

    return {
      id: detail.id,
      serviceId: detail.service_id ?? null,
      serviceName: detail.service ? normalizeText(detail.service.name, 'Servicio sin nombre') : 'Servicio sin nombre',
      quantity,
      unit: detail.service?.unit ?? null,
      unitPrice,
      total,
      status: mapQuoteStatus(detail.status ?? null),
    }
  })

  const attachments: QuoteAttachmentEntry[] = (quote.quote_attachment ?? []).map((attachment) => ({
    id: attachment.id,
    invoiceId: attachment.invoice_id ?? null,
    invoiceNumber: attachment.invoice
      ? normalizeText(attachment.invoice.description, attachment.invoice.id)
      : attachment.invoice_id ?? null,
    invoiceStatus: mapInvoiceStatus(attachment.invoice?.status ?? null),
    invoiceAmount: toNumber(attachment.invoice?.value ?? null),
    invoiceUrl: attachment.invoice?.url ?? null,
  }))

  const observations: QuoteObservation[] = (quote.quote_observation ?? []).map((obs) => ({
    id: obs.id,
    quoteId: obs.quote_id,
    userId: obs.user_id ?? null,
    content: obs.content,
    created: toIso(obs.created),
    updated: toIso(obs.updated),
    status: obs.status ?? null,
  }))

  const comments: QuoteComment[] = (quote.quote_comment ?? []).map((comment) => ({
    id: comment.id,
    quoteId: comment.quote_id,
    userId: comment.user_id ?? null,
    content: comment.content,
    created: toIso(comment.created),
    updated: toIso(comment.updated),
    status: comment.status ?? null,
  }))

  const hasInvoice = attachments.some((attachment) => Boolean(attachment.invoiceId))
  const amount = computeQuoteTotal({ value: quote.value, quote_detail: quote.quote_detail ?? [] })

  const actions: QuoteAction[] = [
    {
      type: 'pdf',
      label: 'Descargar PDF',
      available: Boolean(quote.url),
      url: quote.url ?? null,
    },
    {
      type: 'email',
      label: 'Enviar por correo',
      available: true,
    },
    {
      type: 'invoice',
      label: 'Convertir a factura',
      available: !hasInvoice,
      disabledReason: hasInvoice ? 'La cotización ya fue convertida en factura' : null,
    },
  ]

  return {
    id: quote.id,
    reference: normalizeText((quote as any).consecutive ?? quote.description, quote.id),
    description: quote.description ?? null,
    status: mapQuoteStatus(quote.status ?? null),
    amount,
    issuedAt: toIso(quote.created),
    updatedAt: toIso(quote.updated),
    client: {
      id: quote.client_id ?? null,
      name: quote.client ? normalizeText(quote.client.name, 'Cliente sin nombre') : 'Cliente sin nombre',
    },
    services,
    attachments,
    actions,
    observations,
    comments,
  }
}

export async function generateQuotePdf(id: string) {
  const quote = await prisma.quote.findUnique({
    where: { id },
    select: {
      id: true,
      url: true,
    },
  })

  if (!quote) {
    return null
  }

  const now = new Date()
  const url = quote.url ?? `https://docs.local/quotes/${quote.id}.pdf`

  const updated = await prisma.quote.update({
    where: { id },
    data: {
      url,
      updated: now,
    },
    select: {
      id: true,
      url: true,
      updated: true,
    },
  })

  return {
    id: updated.id,
    url: updated.url,
    generatedAt: toIso(updated.updated),
  }
}

export type SendQuoteEmailPayload = {
  recipients: string[]
  message?: string
}

export async function sendQuoteByEmail(id: string, payload: SendQuoteEmailPayload) {
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      client: true,
    },
  })

  if (!quote) {
    return null
  }

  const recipients = (payload.recipients ?? [])
    .map((recipient) => (typeof recipient === 'string' ? recipient.trim() : ''))
    .filter((recipient) => recipient.length > 0)

  if (recipients.length === 0) {
    throw new Error('Debe proporcionar al menos un destinatario válido')
  }

  const now = new Date()
  await prisma.quote.update({
    where: { id },
    data: {
      updated: now,
    },
  })

  return {
    id: quote.id,
    subject: `Cotización ${normalizeText(quote.description, quote.id)}`,
    recipients,
    message: typeof payload.message === 'string' ? payload.message : null,
    sentAt: now.toISOString(),
  }
}

export async function convertQuoteToInvoice(id: string) {
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      quote_detail: true,
      quote_attachment: {
        include: { invoice: true },
      },
    },
  })

  if (!quote) {
    return null
  }

  const existingAttachment = quote.quote_attachment.find((attachment) => Boolean(attachment.invoice_id))
  if (existingAttachment?.invoice_id) {
    return {
      invoiceId: existingAttachment.invoice_id,
      alreadyConverted: true,
    }
  }

  const now = new Date()

  const attachment = await prisma.$transaction(async (tx) => {
    const invoiceAttachment = await createInvoiceForQuote(tx, quote, now)

    await tx.quote.update({
      where: { id: quote.id },
      data: {
        status: true,
        updated: now,
      },
    })

    return invoiceAttachment
  })

  const invoice = attachment.invoice

  return {
    invoiceId: invoice?.id ?? attachment.invoice_id,
    alreadyConverted: false,
    description: invoice?.description ?? null,
    amount: toNumber(invoice?.value ?? null),
    createdAt: toIso(invoice?.created ?? now),
  }
}

export async function updateQuote(id: string, payload: UpdateQuoteInput): Promise<QuoteDetail | null> {
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      quote_detail: true,
      quote_attachment: {
        include: { invoice: true },
      },
    },
  })

  if (!quote) {
    return null
  }

  const hasInvoice = quote.quote_attachment.some((attachment) => Boolean(attachment.invoice_id))
  if (hasInvoice && payload.status && payload.status !== 'aprobada') {
    throw new QuoteAlreadyInvoicedError('La cotización ya cuenta con una factura y no puede cambiar de estado')
  }

  const now = new Date()
  const data: Record<string, any> = { updated: now }

  if (typeof payload.description !== 'undefined') {
    data.description = payload.description ?? null
  }

  if (typeof payload.status !== 'undefined') {
    data.status = mapStatusFlag(payload.status ?? null)
  }

  if (typeof payload.amount !== 'undefined') {
    data.value = payload.amount === null ? null : formatCurrencyString(payload.amount)
  }

  if (typeof payload.url !== 'undefined') {
    data.url = payload.url ?? null
  }

  const shouldApprove = payload.status === 'aprobada'

  await prisma.$transaction(async (tx) => {
    const updated = await tx.quote.update({
      where: { id },
      data,
      include: {
        quote_detail: true,
        quote_attachment: {
          include: { invoice: true },
        },
      },
    })

    if (shouldApprove) {
      const alreadyHasInvoice = updated.quote_attachment.some((attachment) => Boolean(attachment.invoice_id))
      if (!alreadyHasInvoice) {
        await createInvoiceForQuote(tx, updated, now)
      }
    }
  })

  return getQuoteById(id)
}

export async function deleteQuote(id: string): Promise<void> {
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      quote_attachment: true,
    },
  })

  if (!quote) {
    throw new QuoteNotFoundError()
  }

  const hasInvoice = quote.quote_attachment.some((attachment) => Boolean(attachment.invoice_id))
  if (hasInvoice) {
    throw new QuoteAlreadyInvoicedError('No es posible eliminar una cotización que ya tiene factura generada')
  }

  await prisma.$transaction(async (tx) => {
    await tx.quote_detail.deleteMany({ where: { quote_id: id } })
    await tx.quote_attachment.deleteMany({ where: { quote_id: id } })
    await tx.quote_observation.deleteMany({ where: { quote_id: id } })
    await tx.quote_comment.deleteMany({ where: { quote_id: id } })
    await tx.quote.delete({ where: { id } })
  })
}

/**
 * ================================
 * OBSERVACIONES (ADMIN)
 * ================================
 */

export type CreateObservationInput = {
  quoteId: string
  content: string
  userId?: string | null
}

export type UpdateObservationInput = {
  content: string
}

export async function createObservation(payload: CreateObservationInput): Promise<QuoteObservation> {
  const { quoteId, content, userId } = payload

  if (!quoteId || typeof quoteId !== 'string' || quoteId.trim().length === 0) {
    throw new QuoteValidationError('Debe indicar el identificador de la cotización')
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new QuoteValidationError('La observación no puede estar vacía')
  }

  const quote = await prisma.quote.findUnique({ where: { id: quoteId } })
  if (!quote) {
    throw new QuoteNotFoundError('Cotización no encontrada')
  }

  const now = new Date()
  const observation = await prisma.quote_observation.create({
    data: {
      id: randomUUID(),
      quote_id: quoteId,
      user_id: userId ?? null,
      content: content.trim(),
      created: now,
      updated: now,
      status: true,
    },
  })

  return {
    id: observation.id,
    quoteId: observation.quote_id,
    userId: observation.user_id ?? null,
    content: observation.content,
    created: toIso(observation.created),
    updated: toIso(observation.updated),
    status: observation.status ?? null,
  }
}

export async function updateObservation(
  observationId: string,
  payload: UpdateObservationInput,
): Promise<QuoteObservation | null> {
  const { content } = payload

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new QuoteValidationError('La observación no puede estar vacía')
  }

  const observation = await prisma.quote_observation.findUnique({
    where: { id: observationId },
  })

  if (!observation) {
    return null
  }

  const now = new Date()
  const updated = await prisma.quote_observation.update({
    where: { id: observationId },
    data: {
      content: content.trim(),
      updated: now,
    },
  })

  return {
    id: updated.id,
    quoteId: updated.quote_id,
    userId: updated.user_id ?? null,
    content: updated.content,
    created: toIso(updated.created),
    updated: toIso(updated.updated),
    status: updated.status ?? null,
  }
}

export async function deleteObservation(observationId: string): Promise<void> {
  const observation = await prisma.quote_observation.findUnique({
    where: { id: observationId },
  })

  if (!observation) {
    throw new QuoteNotFoundError('Observación no encontrada')
  }

  await prisma.quote_observation.update({
    where: { id: observationId },
    data: { status: false },
  })
}

export async function listObservationsByQuote(quoteId: string): Promise<QuoteObservation[]> {
  const observations = await prisma.quote_observation.findMany({
    where: {
      quote_id: quoteId,
      status: true,
    },
    orderBy: {
      created: 'desc',
    },
  })

  return observations.map((obs) => ({
    id: obs.id,
    quoteId: obs.quote_id,
    userId: obs.user_id ?? null,
    content: obs.content,
    created: toIso(obs.created),
    updated: toIso(obs.updated),
    status: obs.status ?? null,
  }))
}
