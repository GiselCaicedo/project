import { prisma } from '../../../config/db.js'
import { v4 as uuidv4 } from 'uuid'

interface CreatePaymentData {
  client_id: string
  payment_method_id: string
  value: string
  type: string
  code?: string | null
  url?: string | null
}

/**
 * Lista todos los pagos de un cliente
 */
export async function listClientPayments(clientId: string) {
  return await prisma.payment.findMany({
    where: {
      client_id: clientId,
      status: true,
    },
    include: {
      payment_method: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      created: 'desc',
    },
  })
}

/**
 * Obtiene el detalle de un pago específico
 */
export async function fetchClientPaymentById(clientId: string, paymentId: string) {
  return await prisma.payment.findFirst({
    where: {
      id: paymentId,
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
      payment_method: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
}

/**
 * Crea un nuevo pago
 */
export async function createPayment(data: CreatePaymentData) {
  return await prisma.payment.create({
    data: {
      id: uuidv4(),
      client_id: data.client_id,
      payment_method_id: data.payment_method_id,
      value: data.value,
      type: data.type,
      code: data.code,
      url: data.url,
      status_pay: 'pending', // Estado inicial: pendiente
      status: true,
      created: new Date(),
      updated: new Date(),
    },
    include: {
      payment_method: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
}
