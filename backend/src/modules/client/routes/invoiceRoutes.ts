import { Router } from 'express'
import {
  listClientInvoicesCtrl,
  getClientInvoiceDetailCtrl,
  deleteClientInvoiceCtrl,
  downloadClientInvoiceArtifactCtrl,
  listClientInvoiceObservationsCtrl,
  listClientInvoiceCommentsCtrl,
  createClientInvoiceCommentCtrl,
  updateClientInvoiceCommentCtrl,
  deleteClientInvoiceCommentCtrl,
  reportClientInvoicePaymentCtrl,
} from '../controllers/invoiceController.js'

const invoiceRoutes = Router()

// GET /invoices - Listar todas las facturas del cliente
invoiceRoutes.get('/', listClientInvoicesCtrl)

// GET /invoices/:id - Ver detalle completo de una factura específica
invoiceRoutes.get('/:id', getClientInvoiceDetailCtrl)

// Eliminar factura del cliente
invoiceRoutes.delete('/:id', deleteClientInvoiceCtrl)

// Descargas de documentos (PDF/XML/ZIP)
invoiceRoutes.get('/:id/download/:format', downloadClientInvoiceArtifactCtrl)

// Observaciones (solo ver)
invoiceRoutes.get('/:id/observations', listClientInvoiceObservationsCtrl)

// Comentarios (CRUD cliente)
invoiceRoutes.get('/:id/comments', listClientInvoiceCommentsCtrl)
invoiceRoutes.post('/:id/comments', createClientInvoiceCommentCtrl)
invoiceRoutes.put('/comments/:commentId', updateClientInvoiceCommentCtrl)
invoiceRoutes.delete('/comments/:commentId', deleteClientInvoiceCommentCtrl)

// Informar pago con comprobante
invoiceRoutes.post('/:id/report-payment', reportClientInvoicePaymentCtrl)

export default invoiceRoutes
