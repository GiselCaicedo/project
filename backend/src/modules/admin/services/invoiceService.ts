import { randomUUID } from 'node:crypto'
import { prisma } from '../../../config/db.js'

export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'cancelled'

export type InvoiceTaxLine = {
  id: string
  name: string
  percentage: number
  amount: number
}

export type InvoiceListItem = {
  id: string
  number: string
  description: string | null
  clientId: string | null
  clientName: string
  serviceId: string | null
  serviceName: string | null
  subtotal: number
  taxOne: InvoiceTaxLine | null
  taxTwo: InvoiceTaxLine | null
  includeIva: boolean
  ivaAmount: number
  total: number
  amount: number
  issuedAt: string | null
  dueAt: string | null
  status: InvoiceStatus
  services: number
}

export type InvoiceServiceLine = {
  id: string
  item: number | null
  quantity: number
  total: number
  serviceId: string | null
  serviceName: string
  unit: string | null
}

export type InvoiceAttachment = {
  id: string
  type: 'pdf' | 'xml' | 'zip'
  label: string
}

export type InvoiceRecord = {
  id: string
  number: string
  description: string
  clientId: string | null
  clientName: string
  serviceId: string | null
  serviceName: string | null
  subtotal: number
  taxOne: InvoiceTaxLine | null
  taxTwo: InvoiceTaxLine | null
  includeIva: boolean
  ivaAmount: number
  total: number
  amount: number
  tax1?: number | null
  tax2?: number | null
  vatIncluded?: boolean
  vatRate?: number | null
  quoteConsecutive?: string | null
  issuedAt: string | null
  dueAt: string | null
  status: InvoiceStatus
  url: string | null
  createdAt: string | null
  updatedAt: string | null
  details: InvoiceServiceLine[]
  attachments: InvoiceAttachment[]
  payments?: Array<{ id: string; url: string | null; created: string | null }>
}

export type InvoiceObservation = {
  id: string
  invoiceId: string
  userId: string | null
  content: string
  created: string | null
  updated: string | null
  status: boolean | null
}

export type InvoiceComment = {
  id: string
  invoiceId: string
  userId: string | null
  content: string
  created: string | null
  updated: string | null
  status: boolean | null
}

export type PersistInvoiceDetailInput = {
  serviceId: string
  quantity?: number | null
  total?: number | null
  item?: number | null
}

export type PersistInvoiceInput = {
  clientId: string
  serviceId: string
  number: string
  description?: string | null
  includeIva?: boolean
  subtotal?: number | null
  taxOne?: number | null
  taxTwo?: number | null
  status: 'paid' | 'pending' | 'cancelled'
  issuedAt?: string | null
  dueAt?: string | null
  url?: string | null
  details?: PersistInvoiceDetailInput[]
}

export type InvoiceCatalogEntry = {
  id: string
  name: string
  unit: string | null
  price: number | null
  subtotal: number | null
  taxOne: InvoiceTaxLine | null
  taxTwo: InvoiceTaxLine | null
}

export type InvoiceCatalog = {
  clients: Array<{ id: string; name: string }>
  services: InvoiceCatalogEntry[]
}

const toIso = (value: Date | string | null | undefined): string | null => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  const time = date.getTime()
  return Number.isFinite(time) ? new Date(time).toISOString() : null
}

const parseCurrency = (value?: string | number | null): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9.,-]/g, '').replace(',', '.')
    const parsed = Number.parseFloat(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

const formatCurrencyString = (value: number): string => value.toFixed(2)

const normalizeText = (value: string | null | undefined, fallback: string): string => {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : fallback
}

const decimalToNumberOrNull = (value: any): number | null => {
  if (value === null || typeof value === 'undefined') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  if (typeof value === 'object' && typeof value?.toString === 'function') {
    const parsed = Number.parseFloat(value.toString())
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

const roundCurrency = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Number.parseFloat(value.toFixed(2))
}

const buildTaxLine = (
  tax: any | null,
  amount: number,
  fallbackId: string,
  fallbackName: string,
): InvoiceTaxLine | null => {
  const normalizedAmount = roundCurrency(amount)
  if (!tax) {
    if (normalizedAmount === 0) return null
    return {
      id: fallbackId,
      name: fallbackName,
      percentage: 0,
      amount: normalizedAmount,
    }
  }

  return {
    id: tax.id,
    name: normalizeText(tax.name ?? null, fallbackName),
    percentage: decimalToNumberOrNull(tax.percentage) ?? 0,
    amount: normalizedAmount,
  }
}

const mapStatus = (invoice: any): InvoiceStatus => {
  if (invoice.status === true) return 'paid'
  if (invoice.status === false) return 'cancelled'
  const due = invoice.expiry ?? invoice.updated ?? invoice.created ?? null
  if (due) {
    const dueDate = new Date(due)
    if (Number.isFinite(dueDate.getTime()) && dueDate.getTime() < Date.now()) {
      return 'overdue'
    }
  }
  return 'pending'
}

const mapInvoiceDetail = (detail: any, index: number): InvoiceServiceLine => ({
  id: detail.id,
  item: detail.item ?? index + 1,
  quantity: detail.quantity ?? 0,
  total: parseCurrency(detail.total_value),
  serviceId: detail.service_id ?? null,
  serviceName: detail.service?.name ?? 'Servicio sin nombre',
  unit: detail.service?.unit ?? null,
})

const mapAttachments = (invoice: any): InvoiceAttachment[] => {
  const baseLabel = invoice.description ?? `Factura ${invoice.id}`
  return [
    { id: `${invoice.id}-pdf`, type: 'pdf', label: `${baseLabel}.pdf` },
    { id: `${invoice.id}-xml`, type: 'xml', label: `${baseLabel}.xml` },
    { id: `${invoice.id}-zip`, type: 'zip', label: `${baseLabel}.zip` },
  ]
}

const mapInvoiceRecord = (invoice: any): InvoiceRecord => {
  const details = Array.isArray(invoice.invoice_detail) ? invoice.invoice_detail : []
  const serviceId = invoice.service?.id ?? invoice.service_id ?? null
  const fallbackServiceName = details[0]?.service?.name ?? 'Servicio sin nombre'
  const serviceName = invoice.service
    ? normalizeText(invoice.service.name ?? null, 'Servicio sin nombre')
    : normalizeText(fallbackServiceName ?? null, 'Servicio sin nombre')

  const subtotal = decimalToNumberOrNull(invoice.subtotal) ?? parseCurrency(invoice.value)
  const taxOneAmount = decimalToNumberOrNull(invoice.tax_one) ?? 0
  const taxTwoAmount = decimalToNumberOrNull(invoice.tax_two) ?? 0
  const includeIva = invoice.include_iva === true
  const storedTotal = decimalToNumberOrNull(invoice.total)
  const ivaAmount = includeIva ? roundCurrency(subtotal * 0.19) : 0
  const computedTotal = roundCurrency(subtotal + taxOneAmount + taxTwoAmount + ivaAmount)
  const total = storedTotal ?? computedTotal
  const amount = total

  const taxOne = buildTaxLine(invoice.service?.tax_one ?? null, taxOneAmount, 'tax-one', 'Impuesto 1')
  const taxTwo = buildTaxLine(invoice.service?.tax_two ?? null, taxTwoAmount, 'tax-two', 'Impuesto 2')

  const vatRate = includeIva ? 0.19 : null

  // Obtener el consecutivo de la cotización si existe
  const quoteConsecutive = Array.isArray(invoice.quote_attachment) && invoice.quote_attachment.length > 0
    ? invoice.quote_attachment[0]?.quote?.consecutive ?? null
    : null

  const payments = Array.isArray(invoice.payment_attachment)
    ? invoice.payment_attachment
        .filter((p: any) => p.url)
        .map((p: any) => ({
          id: p.id,
          url: p.url ?? null,
          created: toIso(p.created),
        }))
    : []

  return {
    id: invoice.id,
    number: invoice.consecutive ?? invoice.description ?? invoice.id,
    description: invoice.description ?? '',
    clientId: invoice.client?.id ?? invoice.client_id ?? null,
    clientName: invoice.client?.name ?? 'Cliente sin nombre',
    serviceId,
    serviceName,
    subtotal,
    taxOne,
    taxTwo,
    includeIva,
    ivaAmount,
    total,
    amount,
    tax1: taxOneAmount,
    tax2: taxTwoAmount,
    vatIncluded: includeIva,
    vatRate,
    quoteConsecutive,
    issuedAt: toIso(invoice.created),
    dueAt: toIso(invoice.expiry),
    status: mapStatus(invoice),
    url: invoice.url ?? null,
    createdAt: toIso(invoice.created),
    updatedAt: toIso(invoice.updated),
    details: details.map((detail, index) => mapInvoiceDetail(detail, index)),
    attachments: mapAttachments(invoice),
    payments,
  }
}

const mapInvoiceListItem = (invoice: any): InvoiceListItem => {
  const record = mapInvoiceRecord(invoice)
  return {
    id: record.id,
    number: record.number,
    description: record.description ?? null,
    clientId: record.clientId,
    clientName: record.clientName,
    serviceId: record.serviceId,
    serviceName: record.serviceName,
    subtotal: record.subtotal,
    taxOne: record.taxOne,
    taxTwo: record.taxTwo,
    includeIva: record.includeIva,
    ivaAmount: record.ivaAmount,
    total: record.total,
    amount: record.amount,
    issuedAt: record.issuedAt,
    dueAt: record.dueAt,
    status: record.status,
    services: record.details.length,
  }
}

const normalizeDetailInput = (
  input: PersistInvoiceDetailInput,
  index: number,
): PersistInvoiceDetailInput & { total: number; quantity: number; item: number } => {
  const quantity = Number.isFinite(Number(input.quantity)) ? Number(input.quantity) : 0
  const total = Number.isFinite(Number(input.total)) ? Number(input.total) : 0
  const item = Number.isFinite(Number(input.item)) ? Number(input.item) : index + 1
  return {
    serviceId: input.serviceId,
    quantity,
    total,
    item,
  }
}

const mapStatusFlag = (status: PersistInvoiceInput['status']): boolean | null => {
  if (status === 'paid') return true
  if (status === 'cancelled') return false
  return null
}

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date : null
}

const IVA_RATE = 0.19

type InvoiceTotalsInput = {
  serviceId: string
  includeIva: boolean
  subtotalOverride?: number | null
  taxOneOverride?: number | null
  taxTwoOverride?: number | null
}

type InvoiceTotalsResult = {
  subtotal: number
  taxOneAmount: number
  taxTwoAmount: number
  ivaAmount: number
  total: number
  service: any
}

async function calculateInvoiceTotals(input: InvoiceTotalsInput): Promise<InvoiceTotalsResult> {
  const service = await prisma.service.findUnique({
    where: { id: input.serviceId },
    include: { tax_service_tax_one_idTotax: true, tax_service_tax_two_idTotax: true },
  })

  if (!service) {
    throw new Error('SERVICE_NOT_FOUND')
  }

  const baseSubtotal = decimalToNumberOrNull(service.subtotal) ?? decimalToNumberOrNull(service.price) ?? 0

  const subtotal = roundCurrency(
    typeof input.subtotalOverride === 'number' && Number.isFinite(input.subtotalOverride)
      ? input.subtotalOverride
      : baseSubtotal,
  )

  const taxOnePercentage = decimalToNumberOrNull(service.tax_service_tax_one_idTotax?.percentage ?? null) ?? 0
  const taxTwoPercentage = decimalToNumberOrNull(service.tax_service_tax_two_idTotax?.percentage ?? null) ?? 0

  const computedTaxOne = roundCurrency(subtotal * (taxOnePercentage / 100))
  const computedTaxTwo = roundCurrency(subtotal * (taxTwoPercentage / 100))

  const taxOneAmount = roundCurrency(
    typeof input.taxOneOverride === 'number' && Number.isFinite(input.taxOneOverride)
      ? input.taxOneOverride
      : computedTaxOne,
  )

  const taxTwoAmount = roundCurrency(
    typeof input.taxTwoOverride === 'number' && Number.isFinite(input.taxTwoOverride)
      ? input.taxTwoOverride
      : computedTaxTwo,
  )

  const ivaAmount = input.includeIva ? roundCurrency(subtotal * IVA_RATE) : 0
  const total = roundCurrency(subtotal + taxOneAmount + taxTwoAmount + ivaAmount)

  return { subtotal, taxOneAmount, taxTwoAmount, ivaAmount, total, service }
}

export async function fetchInvoices(): Promise<InvoiceListItem[]> {
  const invoices = await prisma.invoice.findMany({
    include: {
      client: { select: { id: true, name: true } },
      service: { include: { tax_service_tax_one_idTotax: true, tax_service_tax_two_idTotax: true } },
      quote_attachment: {
        include: {
          quote: { select: { id: true, consecutive: true } },
        },
      },
      invoice_detail: {
        include: {
          service: { select: { id: true, name: true, unit: true } },
        },
        orderBy: { item: 'asc' },
      },
    },
    orderBy: { created: 'desc' },
  })

  return invoices.map((invoice) => mapInvoiceListItem(invoice))
}

export async function fetchInvoiceById(id: string): Promise<InvoiceRecord | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      service: { include: { tax_service_tax_one_idTotax: true, tax_service_tax_two_idTotax: true } },
      quote_attachment: {
        include: {
          quote: { select: { id: true, consecutive: true } },
        },
      },
      invoice_detail: {
        include: {
          service: { select: { id: true, name: true, unit: true } },
        },
        orderBy: { item: 'asc' },
      },
      payment_attachment: {
        select: { id: true, url: true, created: true },
        orderBy: { created: 'desc' },
      },
    },
  })

  if (!invoice) return null
  return mapInvoiceRecord(invoice)
}

export async function fetchInvoiceCatalog(): Promise<InvoiceCatalog> {
  const [clients, services] = await Promise.all([
    prisma.client.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.service.findMany({
      include: { tax_service_tax_one_idTotax: true, tax_service_tax_two_idTotax: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return {
    clients: clients.map((client) => ({
      id: client.id,
      name: client.name?.trim() && client.name.trim().length > 0 ? client.name.trim() : 'Cliente sin nombre',
    })),
    services: services.map((service) => ({
      id: service.id,
      name: service.name?.trim() && service.name.trim().length > 0 ? service.name.trim() : 'Servicio sin nombre',
      unit: service.unit ?? null,
      price: decimalToNumberOrNull(service.price) ?? null,
      subtotal: decimalToNumberOrNull(service.subtotal) ?? decimalToNumberOrNull(service.price) ?? null,
      taxOne: buildTaxLine(service.tax_service_tax_one_idTotax ?? null, 0, 'tax-one', 'Impuesto 1'),
      taxTwo: buildTaxLine(service.tax_service_tax_two_idTotax ?? null, 0, 'tax-two', 'Impuesto 2'),
    })),
  }
}

const buildDetailCreateInput = (
  details: PersistInvoiceDetailInput[] | undefined,
  fallbackServiceId: string,
  fallbackTotal: number,
) => {
  if (Array.isArray(details) && details.length > 0) {
    const normalized = details
      .map((detail, index) => normalizeDetailInput(detail, index))
      .filter((detail) => detail.serviceId)

    if (normalized.length > 0) {
      return {
        createMany: {
          data: normalized.map((detail) => ({
            id: randomUUID(),
            service_id: detail.serviceId,
            quantity: detail.quantity,
            total_value: detail.total,
            item: detail.item,
            status: true,
          })),
        },
      }
    }
  }

  if (!fallbackServiceId) return undefined

  return {
    createMany: {
      data: [
        {
          id: randomUUID(),
          service_id: fallbackServiceId,
          quantity: 1,
          total_value: fallbackTotal,
          item: 1,
          status: true,
        },
      ],
    },
  }
}

export async function createInvoice(payload: PersistInvoiceInput): Promise<InvoiceRecord> {
  const includeIva = payload.includeIva ?? false
  const totals = await calculateInvoiceTotals({
    serviceId: payload.serviceId,
    includeIva,
    subtotalOverride: payload.subtotal,
    taxOneOverride: payload.taxOne,
    taxTwoOverride: payload.taxTwo,
  })

  const invoice = await prisma.invoice.create({
    data: {
      id: randomUUID(),
      client_id: payload.clientId,
      service_id: payload.serviceId,
      description: payload.description ?? payload.number,
      consecutive: payload.number,
      value: formatCurrencyString(totals.total),
      subtotal: formatCurrencyString(totals.subtotal),
      tax_one: formatCurrencyString(totals.taxOneAmount),
      tax_two: formatCurrencyString(totals.taxTwoAmount),
      total: formatCurrencyString(totals.total),
      include_iva: includeIva,
      url: payload.url ?? null,
      created: parseDate(payload.issuedAt) ?? new Date(),
      updated: new Date(),
      expiry: parseDate(payload.dueAt),
      status: mapStatusFlag(payload.status),
      invoice_detail: buildDetailCreateInput(payload.details, payload.serviceId, totals.total),
    },
    include: {
      client: { select: { id: true, name: true } },
      service: { include: { tax_service_tax_one_idTotax: true, tax_service_tax_two_idTotax: true } },
      invoice_detail: {
        include: { service: { select: { id: true, name: true, unit: true } } },
        orderBy: { item: 'asc' },
      },
    },
  })

  return mapInvoiceRecord(invoice)
}

async function invoiceHasPayments(invoiceId: string): Promise<boolean> {
  const paymentsCount = await prisma.payment_attachment.count({
    where: { invoice_id: invoiceId },
  })
  return paymentsCount > 0
}

export async function updateInvoice(
  id: string,
  payload: PersistInvoiceInput,
): Promise<InvoiceRecord | null> {
  const invoice = await prisma.invoice.findUnique({ where: { id } })
  if (!invoice) return null

  // Verificar si la factura tiene pagos asociados
  const hasPayments = await invoiceHasPayments(id)
  if (hasPayments) {
    throw new Error('INVOICE_HAS_PAYMENTS')
  }

  const includeIva = typeof payload.includeIva === 'boolean' ? payload.includeIva : invoice.include_iva ?? false
  const totals = await calculateInvoiceTotals({
    serviceId: payload.serviceId,
    includeIva,
    subtotalOverride: payload.subtotal,
    taxOneOverride: payload.taxOne,
    taxTwoOverride: payload.taxTwo,
  })

  await prisma.invoice.update({
    where: { id },
    data: {
      client_id: payload.clientId,
      service_id: payload.serviceId,
      description: payload.description ?? payload.number,
      consecutive: payload.number,
      value: formatCurrencyString(totals.total),
      subtotal: formatCurrencyString(totals.subtotal),
      tax_one: formatCurrencyString(totals.taxOneAmount),
      tax_two: formatCurrencyString(totals.taxTwoAmount),
      total: formatCurrencyString(totals.total),
      include_iva: includeIva,
      url: payload.url ?? null,
      expiry: parseDate(payload.dueAt),
      status: mapStatusFlag(payload.status),
      updated: new Date(),
      created: parseDate(payload.issuedAt) ?? invoice.created,
    },
  })

  await prisma.invoice_detail.deleteMany({ where: { invoice_id: id } })

  const detailInput = buildDetailCreateInput(payload.details, payload.serviceId, totals.total)
  if (detailInput) {
    await prisma.invoice.update({
      where: { id },
      data: {
        invoice_detail: detailInput,
      },
    })
  }

  return fetchInvoiceById(id)
}

export async function deleteInvoice(id: string): Promise<void> {
  await prisma.invoice_detail.deleteMany({ where: { invoice_id: id } })
  await prisma.payment_attachment.deleteMany({ where: { invoice_id: id } })
  await prisma.quote_attachment.deleteMany({ where: { invoice_id: id } })
  await prisma.invoice.delete({ where: { id } })
}

export async function sendInvoiceEmail(
  id: string,
  recipient: string,
): Promise<{ message: string }> {
  const invoice = await fetchInvoiceById(id)
  if (!invoice) {
    throw new Error('Factura no encontrada')
  }

  const address = recipient.trim()
  if (!address) {
    throw new Error('Destinatario inválido')
  }

  return {
    message: `Factura ${invoice.number} enviada a ${address}`,
  }
}

export type InvoiceArtifactFormat = 'pdf' | 'xml' | 'zip'

export type InvoiceArtifact = {
  filename: string
  contentType: string
  content: Buffer
}

const buildArtifactContent = (
  invoice: InvoiceRecord,
  format: InvoiceArtifactFormat,
): InvoiceArtifact => {
  const baseName = invoice.number.replace(/[^a-zA-Z0-9-_]+/g, '_') || `invoice-${invoice.id}`
  const extension = format
  const filename = `${baseName}.${extension}`

  const description = `Factura ${invoice.number}\nCliente: ${invoice.clientName}\nTotal: ${invoice.amount.toFixed(
    2,
  )}\nEmitida: ${invoice.issuedAt ?? 'N/D'}\nVence: ${invoice.dueAt ?? 'N/D'}`

  let contentType = 'application/octet-stream'
  if (format === 'pdf') contentType = 'application/pdf'
  if (format === 'xml') contentType = 'application/xml'
  if (format === 'zip') contentType = 'application/zip'

  const content = Buffer.from(description, 'utf-8')
  return { filename, contentType, content }
}

export async function generateInvoiceArtifact(
  id: string,
  format: InvoiceArtifactFormat,
): Promise<InvoiceArtifact> {
  const invoice = await fetchInvoiceById(id)
  if (!invoice) {
    throw new Error('Factura no encontrada')
  }
  return buildArtifactContent(invoice, format)
}

// ==========================
// Observaciones de Facturas
// ==========================

export type CreateInvoiceObservationInput = { invoiceId: string; userId?: string | null; content: string }
export type UpdateInvoiceObservationInput = { content: string }

export async function listInvoiceObservationsByInvoice(invoiceId: string): Promise<InvoiceObservation[]> {
  const observations = await prisma.invoice_observation.findMany({
    where: { invoice_id: invoiceId, status: { not: false } },
    orderBy: { created: 'desc' },
  })
  return observations.map((obs) => ({
    id: obs.id,
    invoiceId: obs.invoice_id,
    userId: obs.user_id ?? null,
    content: obs.content,
    created: toIso(obs.created),
    updated: toIso(obs.updated),
    status: obs.status ?? null,
  }))
}

export async function createInvoiceObservation(payload: CreateInvoiceObservationInput): Promise<InvoiceObservation> {
  const created = await prisma.invoice_observation.create({
    data: {
      id: randomUUID(),
      invoice_id: payload.invoiceId,
      user_id: payload.userId ?? null,
      content: payload.content,
      status: true,
    },
  })
  return {
    id: created.id,
    invoiceId: created.invoice_id,
    userId: created.user_id ?? null,
    content: created.content,
    created: toIso(created.created),
    updated: toIso(created.updated),
    status: created.status ?? null,
  }
}

export async function updateInvoiceObservation(
  observationId: string,
  payload: UpdateInvoiceObservationInput,
): Promise<InvoiceObservation | null> {
  const existing = await prisma.invoice_observation.findUnique({ where: { id: observationId } })
  if (!existing) return null
  const updated = await prisma.invoice_observation.update({
    where: { id: observationId },
    data: { content: payload.content, updated: new Date() },
  })
  return {
    id: updated.id,
    invoiceId: updated.invoice_id,
    userId: updated.user_id ?? null,
    content: updated.content,
    created: toIso(updated.created),
    updated: toIso(updated.updated),
    status: updated.status ?? null,
  }
}

export async function deleteInvoiceObservation(observationId: string): Promise<void> {
  const existing = await prisma.invoice_observation.findUnique({ where: { id: observationId } })
  if (!existing) return
  await prisma.invoice_observation.update({ where: { id: observationId }, data: { status: false, updated: new Date() } })
}

// ======================
// Comentarios Facturas
// ======================

export type CreateInvoiceCommentInput = { invoiceId: string; userId?: string | null; content: string }
export type UpdateInvoiceCommentInput = { content: string }

export async function listInvoiceCommentsByInvoice(invoiceId: string): Promise<InvoiceComment[]> {
  const comments = await prisma.invoice_comment.findMany({
    where: { invoice_id: invoiceId, status: { not: false } },
    orderBy: { created: 'desc' },
  })
  return comments.map((c) => ({
    id: c.id,
    invoiceId: c.invoice_id,
    userId: c.user_id ?? null,
    content: c.content,
    created: toIso(c.created),
    updated: toIso(c.updated),
    status: c.status ?? null,
  }))
}

export async function createInvoiceComment(payload: CreateInvoiceCommentInput): Promise<InvoiceComment> {
  const created = await prisma.invoice_comment.create({
    data: {
      id: randomUUID(),
      invoice_id: payload.invoiceId,
      user_id: payload.userId ?? null,
      content: payload.content,
      status: true,
    },
  })
  return {
    id: created.id,
    invoiceId: created.invoice_id,
    userId: created.user_id ?? null,
    content: created.content,
    created: toIso(created.created),
    updated: toIso(created.updated),
    status: created.status ?? null,
  }
}

export async function updateInvoiceComment(commentId: string, payload: UpdateInvoiceCommentInput): Promise<InvoiceComment | null> {
  const existing = await prisma.invoice_comment.findUnique({ where: { id: commentId } })
  if (!existing) return null
  const updated = await prisma.invoice_comment.update({ where: { id: commentId }, data: { content: payload.content, updated: new Date() } })
  return {
    id: updated.id,
    invoiceId: updated.invoice_id,
    userId: updated.user_id ?? null,
    content: updated.content,
    created: toIso(updated.created),
    updated: toIso(updated.updated),
    status: updated.status ?? null,
  }
}

export async function deleteInvoiceComment(commentId: string): Promise<void> {
  const existing = await prisma.invoice_comment.findUnique({ where: { id: commentId } })
  if (!existing) return
  await prisma.invoice_comment.update({ where: { id: commentId }, data: { status: false, updated: new Date() } })
}

// ======================
// Facturas Pendientes para Pagos
// ======================

export type PendingInvoiceForPayment = {
  id: string
  number: string
  description: string
  amount: number
  dueAt: string | null
  clientId: string | null
  clientName: string
}

export async function fetchPendingInvoicesByClient(clientId: string): Promise<PendingInvoiceForPayment[]> {
  const invoices = await prisma.invoice.findMany({
    where: {
      client_id: clientId,
      status: null, // null = pending (no pagada ni cancelada)
    },
    select: {
      id: true,
      consecutive: true,
      description: true,
      total: true,
      expiry: true,
      client_id: true,
      client: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { created: 'desc' },
  })

  return invoices.map((invoice) => ({
    id: invoice.id,
    number: invoice.consecutive ?? invoice.description ?? invoice.id,
    description: invoice.description ?? '',
    amount: decimalToNumberOrNull(invoice.total) ?? 0,
    dueAt: toIso(invoice.expiry),
    clientId: invoice.client_id,
    clientName: invoice.client?.name ?? 'Cliente sin nombre',
  }))
}
