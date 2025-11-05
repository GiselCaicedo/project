import { prisma } from '../../../config/db.js';
/**
 * Lista todos los métodos de pago disponibles
 */
export async function listPaymentMethods() {
    return await prisma.payment_method.findMany({
        select: {
            id: true,
            name: true,
        },
        orderBy: {
            name: 'asc',
        },
    });
}
/**
 * Obtiene un método de pago específico por ID
 */
export async function fetchPaymentMethodById(paymentMethodId) {
    return await prisma.payment_method.findUnique({
        where: {
            id: paymentMethodId,
        },
        select: {
            id: true,
            name: true,
        },
    });
}
