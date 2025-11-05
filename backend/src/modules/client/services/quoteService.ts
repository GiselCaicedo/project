import { prisma } from '../../../config/db.js'
import { v4 as uuidv4 } from 'uuid'
import { randomUUID } from 'node:crypto'
import {
  createQuote,
  QuoteValidationError,
  QuoteNotFoundError,
  type CreateQuoteInput,
  type QuoteServiceItemInput,
  type QuoteComment,
} from '../../admin/services/quoteService.js'

const toIso = (value: Date | string | null | undefined): string | null => {
  if (!value) return null
  if (value instanceof Date) {
    return value.toISOString()
  }
  const asDate = new Date(value)
  return Number.isNaN(asDate.getTime()) ? null : asDate.toISOString()
}


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

/**
 * ================================
 * COMENTARIOS (CLIENTE)
 * ================================
 */

export type CreateCommentInput = {
  quoteId: string
  content: string
  userId?: string | null
}

export type UpdateCommentInput = {
  content: string
}

export async function createComment(clientId: string, payload: CreateCommentInput): Promise<QuoteComment> {
  const { quoteId, content, userId } = payload

  if (!quoteId || typeof quoteId !== 'string' || quoteId.trim().length === 0) {
    throw new QuoteValidationError('Debe indicar el identificador de la cotización')
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new QuoteValidationError('El comentario no puede estar vacío')
  }

  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      client_id: clientId,
    },
  })

  if (!quote) {
    throw new QuoteNotFoundError('Cotización no encontrada o no pertenece al cliente')
  }

  const now = new Date()
  const comment = await prisma.quote_comment.create({
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
    id: comment.id,
    quoteId: comment.quote_id,
    userId: comment.user_id ?? null,
    content: comment.content,
    created: toIso(comment.created),
    updated: toIso(comment.updated),
    status: comment.status ?? null,
  }
}

export async function updateComment(
  clientId: string,
  commentId: string,
  payload: UpdateCommentInput,
): Promise<QuoteComment | null> {
  const { content } = payload

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new QuoteValidationError('El comentario no puede estar vacío')
  }

  const comment = await prisma.quote_comment.findFirst({
    where: {
      id: commentId,
    },
    include: {
      quote: true,
    },
  })

  if (!comment || comment.quote?.client_id !== clientId) {
    return null
  }

  const now = new Date()
  const updated = await prisma.quote_comment.update({
    where: { id: commentId },
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

export async function deleteComment(clientId: string, commentId: string): Promise<void> {
  const comment = await prisma.quote_comment.findFirst({
    where: {
      id: commentId,
    },
    include: {
      quote: true,
    },
  })

  if (!comment || comment.quote?.client_id !== clientId) {
    throw new QuoteNotFoundError('Comentario no encontrado')
  }

  await prisma.quote_comment.update({
    where: { id: commentId },
    data: { status: false },
  })
}

export async function listCommentsByQuote(clientId: string, quoteId: string): Promise<QuoteComment[]> {
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      client_id: clientId,
    },
  })

  if (!quote) {
    throw new QuoteNotFoundError('Cotización no encontrada')
  }

  const comments = await prisma.quote_comment.findMany({
    where: {
      quote_id: quoteId,
      status: true,
    },
    orderBy: {
      created: 'desc',
    },
  })

  return comments.map((comment) => ({
    id: comment.id,
    quoteId: comment.quote_id,
    userId: comment.user_id ?? null,
    content: comment.content,
    created: toIso(comment.created),
    updated: toIso(comment.updated),
    status: comment.status ?? null,
  }))
}

/**
 * ================================
 * APROBAR COTIZACIÓN (CLIENTE)
 * ================================
 */

export async function approveQuote(clientId: string, quoteId: string) {
  const quote = await prisma.quote.findFirst({
    where: {
      id: quoteId,
      client_id: clientId,
    },
    include: {
      quote_attachment: true,
    },
  })

  if (!quote) {
    throw new QuoteNotFoundError('Cotización no encontrada')
  }

  const hasInvoice = quote.quote_attachment.some((attachment) => Boolean(attachment.invoice_id))
  if (hasInvoice) {
    throw new QuoteValidationError('La cotización ya tiene una factura asociada')
  }

  const now = new Date()
  const updated = await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: true,
      updated: now,
    },
  })

  return {
    id: updated.id,
    status: 'aprobada',
    updated: toIso(updated.updated),
  }
}
