import { prisma } from '../../../config/db.js'

/**
 * Lista todas las facturas de un cliente
 */
export async function listClientInvoices(clientId: string) {
  return await prisma.invoice.findMany({
    where: {
      client_id: clientId,
      status: true,
    },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      invoice_detail: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              unit: true,
              price: true,
            },
          },
        },
      },
    },
    orderBy: {
      created: 'desc',
    },
  })
}

/**
 * Obtiene el detalle completo de una factura específica
 */
export async function fetchClientInvoiceById(clientId: string, invoiceId: string) {
  return await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      client_id: clientId,
      status: true,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          frequency: true,
        },
      },
      invoice_detail: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              unit: true,
            },
          },
        },
        orderBy: {
          item: 'asc',
        },
      },
      payment_attachment: true,
    },
  })
}
