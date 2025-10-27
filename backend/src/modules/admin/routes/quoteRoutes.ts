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
} from '../controllers/quoteController.js'

const quoteRoutes = Router()

quoteRoutes.get('/', listQuotesCtrl)
quoteRoutes.post('/', createQuoteCtrl)
quoteRoutes.get('/:id', getQuoteByIdCtrl)
quoteRoutes.put('/:id', updateQuoteCtrl)
quoteRoutes.delete('/:id', deleteQuoteCtrl)
quoteRoutes.post('/:id/pdf', generateQuotePdfCtrl)
quoteRoutes.post('/:id/email', sendQuoteEmailCtrl)
quoteRoutes.post('/:id/invoice', convertQuoteToInvoiceCtrl)

export default quoteRoutes
