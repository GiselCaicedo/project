import { prisma } from '../../../config/db.js';
/**
 * Obtiene el resumen financiero general del cliente
 */
export async function getFinancialSummary(clientId) {
    // Obtener totales de facturas
    const invoicesData = await prisma.invoice.aggregate({
        where: {
            client_id: clientId,
            status: true,
        },
        _sum: {
            total: true,
            subtotal: true,
        },
        _count: {
            id: true,
        },
    });
    // Obtener totales de pagos realizados
    const paymentsData = await prisma.payment.aggregate({
        where: {
            client_id: clientId,
            status: true,
            status_pay: 'completed',
        },
        _count: {
            id: true,
        },
    });
    // Calcular suma de pagos manualmente ya que 'value' es String
    const payments = await prisma.payment.findMany({
        where: {
            client_id: clientId,
            status: true,
            status_pay: 'completed',
        },
        select: {
            value: true,
        },
    });
    const totalPaid = payments.reduce((sum, payment) => {
        return sum + (parseFloat(payment.value || '0') || 0);
    }, 0);
    // Obtener facturas pendientes
    const pendingInvoices = await prisma.invoice.count({
        where: {
            client_id: clientId,
            status: true,
            expiry: {
                gte: new Date(),
            },
        },
    });
    // Obtener facturas vencidas
    const overdueInvoices = await prisma.invoice.count({
        where: {
            client_id: clientId,
            status: true,
            expiry: {
                lt: new Date(),
            },
        },
    });
    // Obtener servicios activos
    const activeServices = await prisma.client_service.count({
        where: {
            client_id: clientId,
            expiry: {
                gte: new Date(),
            },
        },
    });
    const totalInvoiced = invoicesData._sum.total || 0;
    const balance = Number(totalInvoiced) - totalPaid;
    return {
        summary: {
            totalInvoices: invoicesData._count.id,
            totalInvoiced: Number(totalInvoiced),
            totalPaid: totalPaid,
            balance: balance,
            pendingInvoices: pendingInvoices,
            overdueInvoices: overdueInvoices,
            activeServices: activeServices,
        },
        generatedAt: new Date().toISOString(),
    };
}
/**
 * Reporte de facturas por período
 */
export async function getInvoicesReport(clientId, startDate, endDate) {
    const where = {
        client_id: clientId,
        status: true,
    };
    if (startDate || endDate) {
        where.created = {};
        if (startDate)
            where.created.gte = new Date(startDate);
        if (endDate)
            where.created.lte = new Date(endDate);
    }
    const invoices = await prisma.invoice.findMany({
        where,
        include: {
            service: {
                select: {
                    name: true,
                    description: true,
                },
            },
            invoice_detail: {
                include: {
                    service: {
                        select: {
                            name: true,
                            price: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            created: 'desc',
        },
    });
    const totals = await prisma.invoice.aggregate({
        where,
        _sum: {
            total: true,
            subtotal: true,
            tax_one: true,
            tax_two: true,
        },
        _count: {
            id: true,
        },
    });
    return {
        period: {
            startDate: startDate || 'all',
            endDate: endDate || 'all',
        },
        invoices,
        totals: {
            count: totals._count.id,
            subtotal: Number(totals._sum.subtotal || 0),
            taxOne: Number(totals._sum.tax_one || 0),
            taxTwo: Number(totals._sum.tax_two || 0),
            total: Number(totals._sum.total || 0),
        },
        generatedAt: new Date().toISOString(),
    };
}
/**
 * Reporte de pagos por período
 */
export async function getPaymentsReport(clientId, startDate, endDate) {
    const where = {
        client_id: clientId,
        status: true,
    };
    if (startDate || endDate) {
        where.created = {};
        if (startDate)
            where.created.gte = new Date(startDate);
        if (endDate)
            where.created.lte = new Date(endDate);
    }
    const payments = await prisma.payment.findMany({
        where,
        include: {
            payment_method: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: {
            created: 'desc',
        },
    });
    // Calcular totales por estado
    const byStatus = payments.reduce((acc, payment) => {
        const status = payment.status_pay || 'unknown';
        if (!acc[status]) {
            acc[status] = { count: 0, total: 0 };
        }
        acc[status].count++;
        acc[status].total += parseFloat(payment.value || '0') || 0;
        return acc;
    }, {});
    // Total general
    const totalAmount = payments.reduce((sum, payment) => {
        return sum + (parseFloat(payment.value || '0') || 0);
    }, 0);
    return {
        period: {
            startDate: startDate || 'all',
            endDate: endDate || 'all',
        },
        payments,
        totals: {
            count: payments.length,
            totalAmount: totalAmount,
            byStatus,
        },
        generatedAt: new Date().toISOString(),
    };
}
/**
 * Reporte de estado de servicios
 */
export async function getServicesStatusReport(clientId) {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    // Servicios activos
    const activeServices = await prisma.client_service.findMany({
        where: {
            client_id: clientId,
            expiry: {
                gte: thirtyDaysFromNow,
            },
        },
        include: {
            service: {
                select: {
                    name: true,
                    description: true,
                    price: true,
                    frequency: true,
                },
            },
        },
        orderBy: {
            expiry: 'asc',
        },
    });
    // Servicios próximos a vencer (30 días)
    const expiringServices = await prisma.client_service.findMany({
        where: {
            client_id: clientId,
            expiry: {
                gte: now,
                lt: thirtyDaysFromNow,
            },
        },
        include: {
            service: {
                select: {
                    name: true,
                    description: true,
                    price: true,
                    frequency: true,
                },
            },
        },
        orderBy: {
            expiry: 'asc',
        },
    });
    // Servicios vencidos
    const expiredServices = await prisma.client_service.findMany({
        where: {
            client_id: clientId,
            expiry: {
                lt: now,
            },
        },
        include: {
            service: {
                select: {
                    name: true,
                    description: true,
                    price: true,
                    frequency: true,
                },
            },
        },
        orderBy: {
            expiry: 'desc',
        },
    });
    return {
        summary: {
            active: activeServices.length,
            expiringSoon: expiringServices.length,
            expired: expiredServices.length,
            total: activeServices.length + expiringServices.length + expiredServices.length,
        },
        services: {
            active: activeServices,
            expiringSoon: expiringServices,
            expired: expiredServices,
        },
        generatedAt: new Date().toISOString(),
    };
}
/**
 * Estado de cuenta detallado
 */
export async function getAccountStatement(clientId, startDate, endDate) {
    const where = {
        client_id: clientId,
        status: true,
    };
    if (startDate || endDate) {
        where.created = {};
        if (startDate)
            where.created.gte = new Date(startDate);
        if (endDate)
            where.created.lte = new Date(endDate);
    }
    // Obtener facturas
    const invoices = await prisma.invoice.findMany({
        where,
        select: {
            id: true,
            description: true,
            total: true,
            created: true,
            expiry: true,
            service: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: {
            created: 'desc',
        },
    });
    // Obtener pagos
    const payments = await prisma.payment.findMany({
        where,
        select: {
            id: true,
            code: true,
            value: true,
            status_pay: true,
            created: true,
            payment_method: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: {
            created: 'desc',
        },
    });
    // Combinar y ordenar transacciones
    const transactions = [
        ...invoices.map((inv) => ({
            type: 'invoice',
            id: inv.id,
            description: inv.description || inv.service?.name || 'Factura',
            amount: Number(inv.total || 0),
            date: inv.created,
            dueDate: inv.expiry,
        })),
        ...payments.map((pay) => ({
            type: 'payment',
            id: pay.id,
            description: `Pago ${pay.code || ''} - ${pay.payment_method?.name || 'N/A'}`,
            amount: parseFloat(pay.value || '0') || 0,
            status: pay.status_pay,
            date: pay.created,
        })),
    ].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });
    // Calcular balance
    const totalInvoices = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
    const totalPayments = payments
        .filter((pay) => pay.status_pay === 'completed')
        .reduce((sum, pay) => sum + (parseFloat(pay.value || '0') || 0), 0);
    const balance = totalInvoices - totalPayments;
    return {
        period: {
            startDate: startDate || 'all',
            endDate: endDate || 'all',
        },
        transactions,
        summary: {
            totalInvoices: totalInvoices,
            totalPayments: totalPayments,
            balance: balance,
            invoicesCount: invoices.length,
            paymentsCount: payments.length,
        },
        generatedAt: new Date().toISOString(),
    };
}
