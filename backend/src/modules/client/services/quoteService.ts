import { prisma } from '../../../config/db.js'
import { v4 as uuidv4 } from 'uuid'
import {
  createQuote,
  QuoteValidationError,
  type CreateQuoteInput,
  type QuoteServiceItemInput,
} from '../../admin/services/quoteService.js'

/**
 * Lista todas las cotizaciones de un cliente
 */
export async function listClientQuotes(clientId: string) {
  return await prisma.quote.findMany({
    where: {
      client_id: clientId,
    },
    include: {
      quote_detail: {
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
      },
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
}

/**
 * Obtiene el detalle completo de una cotización específica
 */
export async function fetchClientQuoteById(clientId: string, quoteId: string) {
  return await prisma.quote.findFirst({
    where: {
      id: quoteId,
      client_id: clientId,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
      quote_detail: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              unit: true,
              frequency: true,
            },
          },
        },
        orderBy: {
          item: 'asc',
        },
      },
      quote_attachment: true,
    },
  })
}

/**
 * Genera una factura a partir de una cotización
 */
export async function generateInvoiceFromQuote(quoteId: string, clientId: string) {
  // Obtener la cotización con sus detalles
  const quote = await fetchClientQuoteById(clientId, quoteId)
  if (!quote) {
    throw new Error('Cotización no encontrada')
  }

  // Calcular totales
  let subtotal = 0
  quote.quote_detail.forEach((detail) => {
    subtotal += detail.total_value || 0
  })

  // Por ahora usamos impuestos en 0, pero se pueden calcular según la configuración
  const taxOne = 0
  const taxTwo = 0
  const total = subtotal + taxOne + taxTwo

  // Crear la factura
  const invoice = await prisma.invoice.create({
    data: {
      id: uuidv4(),
      client_id: clientId,
      description: quote.description,
      value: quote.value,
      url: quote.url,
      subtotal: subtotal,
      tax_one: taxOne,
      tax_two: taxTwo,
      total: total,
      include_iva: false,
      status: true,
      created: new Date(),
      updated: new Date(),
    },
  })

  // Crear los detalles de la factura a partir de los detalles de la cotización
  for (const detail of quote.quote_detail) {
    await prisma.invoice_detail.create({
      data: {
        id: uuidv4(),
        invoice_id: invoice.id,
        service_id: detail.service_id,
        item: detail.item,
        quantity: detail.quantity,
        total_value: detail.total_value,
        status: true,
        created: new Date(),
        updated: new Date(),
      },
    })
  }

  // Crear la relación en quote_attachment
  await prisma.quote_attachment.create({
    data: {
      id: uuidv4(),
      quote_id: quoteId,
      invoice_id: invoice.id,
    },
  })

  // Retornar la factura con sus detalles
  return await prisma.invoice.findUnique({
    where: { id: invoice.id },
    include: {
      invoice_detail: {
        include: {
          service: true,
        },
      },
    },
  })
}

export type SubmitClientQuoteInput = {
  description?: string | null
  issuedAt?: Date | null
  services: QuoteServiceItemInput[]
}

export async function submitClientQuote(clientId: string, payload: SubmitClientQuoteInput) {
  const input: CreateQuoteInput = {
    clientId,
    description: typeof payload.description === 'string' ? payload.description : payload.description ?? null,
    issuedAt: payload.issuedAt ?? undefined,
    services: payload.services,
  }

  try {
    const created = await createQuote(input)
    const stored = await fetchClientQuoteById(clientId, created.id)
    return stored ?? created
  } catch (error) {
    if (error instanceof QuoteValidationError) {
      throw error
    }
    throw error
  }
}
