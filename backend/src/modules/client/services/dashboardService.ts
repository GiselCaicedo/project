import { prisma } from '../../../config/db.js'

/**
 * Interfaces para el dashboard del cliente
 */
export interface ClientBalanceSummary {
  totalBalance: number
  totalSpent: number
  totalPending: number
}

export interface ServiceConsumption {
  serviceId: string
  serviceName: string
  consumption: number
  lastUsage: string | null
}

export interface ExpirationItem {
  id: string
  type: 'invoice' | 'service'
  name: string
  description: string | null
  amount: number
  expiry: string | null
  daysUntilExpiry: number | null
  status: 'active' | 'pending' | 'expired'
  url: string | null
}

export interface ClientDashboardData {
  balance: ClientBalanceSummary
  serviceConsumption: ServiceConsumption[]
  expirations: ExpirationItem[]
}

/**
 * Parsea valores monetarios de string a number
 */
function parseCurrency(value?: string | null): number {
  if (!value) return 0

  const cleaned = value.replace(/[^0-9,.-]/g, '')
  const commaCount = (cleaned.match(/,/g) ?? []).length
  const dotCount = (cleaned.match(/\./g) ?? []).length

  let normalized = cleaned

  if (commaCount > 0 && dotCount > 0) {
    if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
      normalized = normalized.replace(/\./g, '').replace(/,/g, '.')
    } else {
      normalized = normalized.replace(/,/g, '')
    }
  } else if (commaCount > 0) {
    normalized = normalized.replace(/,/g, '.')
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Obtiene el resumen de saldo del cliente
 */
export async function fetchClientBalance(clientId: string): Promise<ClientBalanceSummary> {
  // Obtener todos los pagos del cliente (recargas de saldo)
  const payments = await prisma.payment.findMany({
    where: {
      client_id: clientId,
      status: true,
      type: 'recarga', // Solo pagos de recarga de saldo
    },
    select: {
      value: true,
      status_pay: true,
    },
  })

  // Obtener todas las facturas del cliente (consumos)
  const invoices = await prisma.invoice.findMany({
    where: {
      client_id: clientId,
      status: true,
    },
    select: {
      total: true,
      expiry: true,
    },
  })

  // Calcular total recargado (solo pagos completados)
  const totalBalance = payments.reduce((acc, payment) => {
    if (payment.status_pay === 'completed') {
      return acc + parseCurrency(payment.value)
    }
    return acc
  }, 0)

  // Calcular total gastado y pendiente (basado en facturas)
  const now = new Date()
  let totalSpent = 0
  let totalPending = 0

  invoices.forEach((invoice) => {
    const amount = Number(invoice.total || 0)

    // Si la factura no ha vencido, se considera pendiente
    if (invoice.expiry && invoice.expiry > now) {
      totalPending += amount
    } else {
      // Si ya venció, se considera gastado
      totalSpent += amount
    }
  })

  return {
    totalBalance: totalBalance - totalSpent - totalPending,
    totalSpent,
    totalPending,
  }
}

/**
 * Obtiene el consumo de saldo por servicio
 */
export async function fetchServiceConsumption(clientId: string): Promise<ServiceConsumption[]> {
  console.log(`[DEBUG] Iniciando fetchServiceConsumption para cliente: ${clientId}`)

  // Obtener servicios del cliente
  const clientServices = await prisma.client_service.findMany({
    where: {
      client_id: clientId,
    },
    include: {
      service: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
  console.log(`[DEBUG] Servicios encontrados para el cliente: ${clientServices.length}`)

  // Obtener el uso de cada servicio
  const serviceConsumptionData = await Promise.all(
    clientServices.map(async (cs) => {
      console.log(`[DEBUG] Procesando servicio: ${cs.service?.name || cs.service_id}`)

      // Buscar el último registro de uso para este servicio
      const lastUsageRecord = await prisma.service_usage.findFirst({
        where: {
          client_id: clientId,
          service_id: cs.service_id!,
        },
        orderBy: {
          created: 'desc',
        },
      })
      console.log(`[DEBUG] Último uso encontrado: ${lastUsageRecord ? 'Sí' : 'No'}`)

      // Intentar leer unit/value desde usage si viene como JSON, si no parsear como moneda
      let consumption = 0
      if (lastUsageRecord?.usage) {
        const raw = String(lastUsageRecord.usage)
        console.log(`[DEBUG] Valor raw de usage: ${raw}`)
        
        try {
          const parsed = JSON.parse(raw)
          console.log(`[DEBUG] JSON parseado correctamente: ${typeof parsed}`)
          
          if (parsed && typeof parsed === 'object') {
            const value = (parsed as any).value
            console.log(`[DEBUG] Valor encontrado en JSON: ${value} (tipo: ${typeof value})`)
            
            if (typeof value === 'number') consumption = value
            else if (typeof value === 'string') consumption = parseCurrency(value)
            else consumption = 0
          } else {
            consumption = parseCurrency(raw)
          }
        } catch (error) {
          console.log(`[DEBUG] Error al parsear JSON: ${error.message}`)
          consumption = parseCurrency(raw)
        }
      }
      console.log(`[DEBUG] Consumo final calculado: ${consumption}`)

      return {
        serviceId: cs.service?.id || cs.service_id || '',
        serviceName: cs.service?.name || 'Servicio sin nombre',
        consumption,
        lastUsage: lastUsageRecord?.created?.toISOString() || null,
      }
    }),
  )

  console.log(`[DEBUG] Proceso completado. Total servicios procesados: ${serviceConsumptionData.length}`)
  return serviceConsumptionData
}

/**
 * Obtiene los vencimientos próximos (facturas y servicios)
 */
export async function fetchClientExpirations(
  clientId: string,
  daysAhead = 30,
): Promise<ExpirationItem[]> {
  const now = new Date()
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  const expirations: ExpirationItem[] = []

  // Obtener facturas próximas a vencer
  const invoices = await prisma.invoice.findMany({
    where: {
      client_id: clientId,
      status: true,
      expiry: {
        lte: futureDate,
      },
    },
    orderBy: {
      expiry: 'asc',
    },
  })

  // Agregar facturas a la lista de vencimientos
  for (const invoice of invoices) {
    const expiryDate = invoice.expiry
    const daysUntil = expiryDate
      ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null

    let status: 'active' | 'pending' | 'expired' = 'pending'
    if (expiryDate && expiryDate < now) {
      status = 'expired'
    }

    expirations.push({
      id: invoice.id,
      type: 'invoice',
      name: `Factura ${invoice.description || invoice.id}`,
      description: invoice.description,
      amount: Number(invoice.total || 0),
      expiry: expiryDate?.toISOString() || null,
      daysUntilExpiry: daysUntil,
      status,
      url: invoice.url,
    })
  }

  // Obtener servicios próximos a vencer
  const services = await prisma.client_service.findMany({
    where: {
      client_id: clientId,
      expiry: {
        lte: futureDate,
      },
    },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
        },
      },
    },
    orderBy: {
      expiry: 'asc',
    },
  })

  // Agregar servicios a la lista de vencimientos
  for (const clientService of services) {
    const expiryDate = clientService.expiry
    const daysUntil = expiryDate
      ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null

    let status: 'active' | 'pending' | 'expired' = 'active'
    if (expiryDate && expiryDate < now) {
      status = 'expired'
    }

    expirations.push({
      id: clientService.id,
      type: 'service',
      name: clientService.service?.name || 'Servicio sin nombre',
      description: clientService.service?.description,
      amount: Number(clientService.service?.price || 0),
      expiry: expiryDate?.toISOString() || null,
      daysUntilExpiry: daysUntil,
      status,
      url: clientService.url_api,
    })
  }

  // Ordenar por días hasta vencimiento
  return expirations.sort((a, b) => {
    if (a.daysUntilExpiry === null) return 1
    if (b.daysUntilExpiry === null) return -1
    return a.daysUntilExpiry - b.daysUntilExpiry
  })
}

/**
 * Obtiene todos los datos del dashboard del cliente
 */
export async function fetchClientDashboardData(clientId: string): Promise<ClientDashboardData> {
  const [balance, serviceConsumption, expirations] = await Promise.all([
    fetchClientBalance(clientId),
    fetchServiceConsumption(clientId),
    fetchClientExpirations(clientId),
  ])

  return {
    balance,
    serviceConsumption,
    expirations,
  }
}
