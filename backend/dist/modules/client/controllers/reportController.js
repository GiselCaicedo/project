import { getFinancialSummary, getInvoicesReport, getPaymentsReport, getServicesStatusReport, getAccountStatement, } from '../services/reportService.js';
/**
 * GET /reports/financial-summary
 * Resumen financiero general del cliente
 */
export async function getFinancialSummaryReportCtrl(req, res) {
    try {
        const clientId = req?.user?.empresaid;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        }
        const summary = await getFinancialSummary(clientId);
        return res.json({ success: true, data: summary });
    }
    catch (error) {
        console.error('getFinancialSummaryReportCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible generar el resumen financiero' });
    }
}
/**
 * GET /reports/invoices?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Reporte de facturas por período
 */
export async function getInvoicesReportCtrl(req, res) {
    try {
        const clientId = req?.user?.empresaid;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        }
        const { startDate, endDate } = req.query;
        const report = await getInvoicesReport(clientId, startDate, endDate);
        return res.json({ success: true, data: report });
    }
    catch (error) {
        console.error('getInvoicesReportCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible generar el reporte de facturas' });
    }
}
/**
 * GET /reports/payments?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Reporte de pagos por período
 */
export async function getPaymentsReportCtrl(req, res) {
    try {
        const clientId = req?.user?.empresaid;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        }
        const { startDate, endDate } = req.query;
        const report = await getPaymentsReport(clientId, startDate, endDate);
        return res.json({ success: true, data: report });
    }
    catch (error) {
        console.error('getPaymentsReportCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible generar el reporte de pagos' });
    }
}
/**
 * GET /reports/services-status
 * Estado de servicios (activos, próximos a vencer, vencidos)
 */
export async function getServicesStatusReportCtrl(req, res) {
    try {
        const clientId = req?.user?.empresaid;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        }
        const report = await getServicesStatusReport(clientId);
        return res.json({ success: true, data: report });
    }
    catch (error) {
        console.error('getServicesStatusReportCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible generar el reporte de estado de servicios' });
    }
}
/**
 * GET /reports/account-statement?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Estado de cuenta detallado
 */
export async function getAccountStatementReportCtrl(req, res) {
    try {
        const clientId = req?.user?.empresaid;
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Falta empresa en el token' });
        }
        const { startDate, endDate } = req.query;
        const statement = await getAccountStatement(clientId, startDate, endDate);
        return res.json({ success: true, data: statement });
    }
    catch (error) {
        console.error('getAccountStatementReportCtrl error', error);
        return res.status(500).json({ success: false, message: 'No fue posible generar el estado de cuenta' });
    }
}
