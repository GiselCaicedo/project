import { Router } from 'express';
import { getFinancialSummaryReportCtrl, getInvoicesReportCtrl, getPaymentsReportCtrl, getServicesStatusReportCtrl, getAccountStatementReportCtrl, } from '../controllers/reportController.js';
const reportRoutes = Router();
// GET /reports/financial-summary - Resumen financiero general
reportRoutes.get('/financial-summary', getFinancialSummaryReportCtrl);
// GET /reports/invoices - Reporte de facturas por período
reportRoutes.get('/invoices', getInvoicesReportCtrl);
// GET /reports/payments - Reporte de pagos por período
reportRoutes.get('/payments', getPaymentsReportCtrl);
// GET /reports/services-status - Estado de servicios (activos, próximos a vencer, vencidos)
reportRoutes.get('/services-status', getServicesStatusReportCtrl);
// GET /reports/account-statement - Estado de cuenta detallado
reportRoutes.get('/account-statement', getAccountStatementReportCtrl);
export default reportRoutes;
