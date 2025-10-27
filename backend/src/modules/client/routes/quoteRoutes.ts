import { Router } from 'express'
import {
  listClientQuotesCtrl,
  createClientQuoteCtrl,
  getClientQuoteDetailCtrl,
  generateInvoiceFromQuoteCtrl,
} from '../controllers/quoteController.js'

const quoteRoutes = Router()

// GET /quotes - Listar todas las cotizaciones del cliente
quoteRoutes.get('/', listClientQuotesCtrl)

// POST /quotes - Crear una nueva cotización
quoteRoutes.post('/', createClientQuoteCtrl)

// GET /quotes/:id - Ver detalle de una cotización específica
quoteRoutes.get('/:id', getClientQuoteDetailCtrl)

// POST /quotes/:id/generate-invoice - Generar factura desde cotización
quoteRoutes.post('/:id/generate-invoice', generateInvoiceFromQuoteCtrl)

export default quoteRoutes
