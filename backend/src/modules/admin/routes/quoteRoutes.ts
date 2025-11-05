import { Router } from 'express'
import {
  convertQuoteToInvoiceCtrl,
  createQuoteCtrl,
  deleteQuoteCtrl,
  generateQuotePdfCtrl,
  getQuoteByIdCtrl,
  listQuotesCtrl,
  sendQuoteEmailCtrl,
  updateQuoteCtrl,
  createObservationCtrl,
  updateObservationCtrl,
  deleteObservationCtrl,
  listObservationsByQuoteCtrl,
  updateQuoteServicesCtrl,
} from '../controllers/quoteController.js'

const quoteRoutes = Router()

quoteRoutes.get('/', listQuotesCtrl)
quoteRoutes.post('/', createQuoteCtrl)
quoteRoutes.get('/:id', getQuoteByIdCtrl)
quoteRoutes.put('/:id', updateQuoteCtrl)
quoteRoutes.put('/:id/services', updateQuoteServicesCtrl)
quoteRoutes.delete('/:id', deleteQuoteCtrl)
quoteRoutes.post('/:id/pdf', generateQuotePdfCtrl)
quoteRoutes.post('/:id/email', sendQuoteEmailCtrl)
quoteRoutes.post('/:id/invoice', convertQuoteToInvoiceCtrl)

// Observaciones (Admin)
quoteRoutes.get('/:id/observations', listObservationsByQuoteCtrl)
quoteRoutes.post('/:id/observations', createObservationCtrl)
quoteRoutes.put('/observations/:observationId', updateObservationCtrl)
quoteRoutes.delete('/observations/:observationId', deleteObservationCtrl)

export default quoteRoutes
