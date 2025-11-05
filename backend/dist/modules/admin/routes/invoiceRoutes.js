import { Router } from 'express';
import { listInvoicesCtrl, getInvoiceByIdCtrl, createInvoiceCtrl, updateInvoiceCtrl, deleteInvoiceCtrl, sendInvoiceEmailCtrl, downloadInvoiceArtifactCtrl, getInvoiceCatalogCtrl, listInvoiceObservationsCtrl, createInvoiceObservationCtrl, updateInvoiceObservationCtrl, deleteInvoiceObservationCtrl, listInvoiceCommentsCtrl, getPendingInvoicesByClientCtrl, } from '../controllers/invoiceController.js';
const invoiceRoutes = Router();
invoiceRoutes.get('/', listInvoicesCtrl);
invoiceRoutes.get('/catalog', getInvoiceCatalogCtrl);
invoiceRoutes.get('/pending/:clientId', getPendingInvoicesByClientCtrl);
invoiceRoutes.post('/', createInvoiceCtrl);
invoiceRoutes.get('/:id', getInvoiceByIdCtrl);
invoiceRoutes.put('/:id', updateInvoiceCtrl);
invoiceRoutes.delete('/:id', deleteInvoiceCtrl);
invoiceRoutes.post('/:id/send-email', sendInvoiceEmailCtrl);
invoiceRoutes.get('/:id/download/:format', downloadInvoiceArtifactCtrl);
// Observaciones (Admin CRUD)
invoiceRoutes.get('/:id/observations', listInvoiceObservationsCtrl);
invoiceRoutes.post('/:id/observations', createInvoiceObservationCtrl);
invoiceRoutes.put('/observations/:observationId', updateInvoiceObservationCtrl);
invoiceRoutes.delete('/observations/:observationId', deleteInvoiceObservationCtrl);
// Comentarios (solo ver en admin)
invoiceRoutes.get('/:id/comments', listInvoiceCommentsCtrl);
export default invoiceRoutes;
