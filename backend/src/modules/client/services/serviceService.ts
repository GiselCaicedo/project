import { prisma } from '../../../config/db.js'

export type ServiceStatus = 'active' | 'inactive'

export type ServiceCategoryRecord = {
  id: string
  name: string
}

export type ServiceTaxSummary = {
  id: string
  name: string
  percentage: number
}

export type ClientServiceSummary = {
  id: string
  serviceId: string
  name: string
  description: string | null
  unit: string | null
  price: number | null
  frequency: string | null
  category: ServiceCategoryRecord | null
  started: string | null
  delivery: string | null
  expiry: string | null
  status: ServiceStatus
}

export type ServiceUsageRecord = {
  id: string
  startDate: string | null
  endDate: string | null
  usage: string | null
  status: string | null
  createdAt: string | null
}

export type ClientServiceDetail = {
  id: string
  serviceId: string
  name: string
  description: string | null
  unit: string | null
  price: number | null
  subtotal: number | null
  frequency: string | null
  category: ServiceCategoryRecord | null
  taxOne: ServiceTaxSummary | null
  taxTwo: ServiceTaxSummary | null
  started: string | null
  delivery: string | null
  expiry: string | null
  urlApi: string | null
  tokenApi: string | null
  status: ServiceStatus
  usage: ServiceUsageRecord[]
}

const toIso = (value: Date | null | undefined): string | null => (value ? value.toISOString() : null)

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

const mapStatus = (status: boolean | null | undefined): ServiceStatus => (status === false ? 'inactive' : 'active')

const mapTax = (tax: any | null): ServiceTaxSummary | null => {
  if (!tax) return null
  const percentage = decimalToNumberOrNull(tax.percentage) ?? 0
  return {
    id: tax.id,
    name: normalizeText(tax.name ?? null, 'Impuesto sin nombre'),
    percentage,
  }
}

const mapCategory = (category: any | null): ServiceCategoryRecord | null => {
  if (!category) return null
  return {
    id: category.id,
    name: normalizeText(category.name ?? null, 'Sin categoría'),
  }
}

const mapServiceUsage = (usage: any): ServiceUsageRecord => ({
  id: usage.id,
  startDate: toIso(usage.start_date),
  endDate: toIso(usage.end_date),
  usage: usage.usage ?? null,
  status: usage.status ?? null,
  createdAt: toIso(usage.created),
})

const mapClientServiceSummary = (assignment: any): ClientServiceSummary => {
  const service = assignment.service
  return {
    id: assignment.id,
    serviceId: service?.id ?? '',
    name: normalizeText(service?.name ?? null, 'Servicio sin nombre'),
    description: service?.description ?? null,
    unit: assignment.unit ?? service?.unit ?? null,
    price: decimalToNumberOrNull(service?.price ?? null),
    frequency: assignment.frequency ?? service?.frequency ?? null,
    category: mapCategory(service?.service_category ?? null),
    started: toIso(assignment.started),
    delivery: toIso(assignment.delivery),
    expiry: toIso(assignment.expiry),
    status: mapStatus(service?.status ?? null),
  }
}

const mapClientServiceDetail = (assignment: any): ClientServiceDetail => {
  const service = assignment.service
  return {
    id: assignment.id,
    serviceId: service?.id ?? '',
    name: normalizeText(service?.name ?? null, 'Servicio sin nombre'),
    description: service?.description ?? null,
    unit: assignment.unit ?? service?.unit ?? null,
    price: decimalToNumberOrNull(service?.price ?? null),
    subtotal: decimalToNumberOrNull(service?.subtotal ?? null) ?? decimalToNumberOrNull(service?.price ?? null),
    frequency: assignment.frequency ?? service?.frequency ?? null,
    category: mapCategory(service?.service_category ?? null),
    taxOne: mapTax(service?.tax_one ?? null),
    taxTwo: mapTax(service?.tax_two ?? null),
    started: toIso(assignment.started),
    delivery: toIso(assignment.delivery),
    expiry: toIso(assignment.expiry),
    urlApi: assignment.url_api ?? null,
    tokenApi: assignment.token_api ?? null,
    status: mapStatus(service?.status ?? null),
    usage: Array.isArray(service?.service_usage) ? service.service_usage.map(mapServiceUsage) : [],
  }
}

export async function listClientServices(clientId: string): Promise<ClientServiceSummary[]> {
  const assignments = await prisma.client_service.findMany({
    where: { client_id: clientId },
    include: {
      service: {
        include: {
          service_category: true,
        },
      },
    },
    orderBy: { created: 'desc' },
  })

  return assignments.map(mapClientServiceSummary)
}

export async function fetchClientServiceById(clientId: string, serviceId: string): Promise<ClientServiceDetail | null> {
  const assignment = await prisma.client_service.findFirst({
    where: {
      client_id: clientId,
      service_id: serviceId,
    },
    include: {
      service: {
        include: {
          service_category: true,
          tax_one: true,
          tax_two: true,
          service_usage: {
            where: { client_id: clientId },
            orderBy: { created: 'desc' },
          },
        },
      },
    },
  })

  if (!assignment) return null

  return mapClientServiceDetail(assignment)
}
