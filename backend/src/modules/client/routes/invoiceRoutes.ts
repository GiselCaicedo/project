import { Router } from 'express'
import {
  listClientInvoicesCtrl,
  getClientInvoiceDetailCtrl,
} from '../controllers/invoiceController.js'

const invoiceRoutes = Router()

// GET /invoices - Listar todas las facturas del cliente
invoiceRoutes.get('/', listClientInvoicesCtrl)

// GET /invoices/:id - Ver detalle completo de una factura específica
invoiceRoutes.get('/:id', getClientInvoiceDetailCtrl)

export default invoiceRoutes
