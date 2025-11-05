import { prisma } from '../../../config/db.js'

export type ServiceRequestStatus = 'abierto' | 'proceso' | 'cerrado'

export type ServiceRequestRecord = {
  id: string
  client: { id: string; name: string }
  service: { id: string; name: string }
  description: string | null
  status: ServiceRequestStatus
  createdAt: string
  updatedAt: string | null
  reviewedBy: { id: string; name: string } | null
  reviewedAt: string | null
  notes: string | null
}

const toIso = (d: Date | null | undefined) => (d ? d.toISOString() : null)

const mapRequest = (r: any): ServiceRequestRecord => ({
  id: r.id,
  client: { id: r.client?.id ?? r.client_id, name: r.client?.name ?? 'Cliente' },
  service: { id: r.service?.id ?? r.service_id, name: r.service?.name ?? 'Servicio' },
  description: r.description ?? null,
  status: ((): ServiceRequestStatus => { const s = String(r.status ?? 'abierto').toLowerCase(); if (s === 'cerrado' || s === 'closed') return 'cerrado'; if (s === 'proceso' || s === 'in_progress' || s === 'process') return 'proceso'; return 'abierto'; })(),
  createdAt: toIso(r.created) ?? new Date().toISOString(),
  updatedAt: toIso(r.updated),
  reviewedBy: r.user ? { id: r.user.id, name: r.user.name ?? 'Revisor' } : null,
  reviewedAt: toIso(r.reviewed_at),
  notes: r.notes ?? null,
})

export async function listClientServiceRequests(clientId: string): Promise<ServiceRequestRecord[]> {
  const rows = await prisma.service_request.findMany({
    where: { client_id: clientId },
    include: {
      client: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { created: 'desc' },
  })
  return rows.map(mapRequest)
}

export async function createClientServiceRequest(input: { clientId: string; serviceId: string; description: string | null }) {
  // Ensure service exists
  const service = await prisma.service.findUnique({ where: { id: input.serviceId }, select: { id: true, name: true } })
  if (!service) {
    throw new Error('Servicio no encontrado')
  }
  const client = await prisma.client.findUnique({ where: { id: input.clientId }, select: { id: true, name: true } })
  if (!client) {
    throw new Error('Cliente no encontrado')
  }

  const created = await prisma.service_request.create({
    data: {
      client_id: input.clientId,
      service_id: input.serviceId,
      description: input.description,
      status: 'abierto',
      created: new Date(),
    },
    include: {
      client: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
    },
  })

  return mapRequest(created)
}

