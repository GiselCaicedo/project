import { Router } from 'express';
import { listClientQuotesCtrl, createClientQuoteCtrl, getClientQuoteDetailCtrl, generateInvoiceFromQuoteCtrl, sendClientQuoteEmailCtrl, createCommentCtrl, updateCommentCtrl, deleteCommentCtrl, listCommentsByQuoteCtrl, approveQuoteCtrl, } from '../controllers/quoteController.js';
const quoteRoutes = Router();
// GET /quotes - Listar todas las cotizaciones del cliente
quoteRoutes.get('/', listClientQuotesCtrl);
// POST /quotes - Crear una nueva cotización
quoteRoutes.post('/', createClientQuoteCtrl);
// GET /quotes/:id - Ver detalle de una cotización específica
quoteRoutes.get('/:id', getClientQuoteDetailCtrl);
// POST /quotes/:id/generate-invoice - Generar factura desde cotización
quoteRoutes.post('/:id/generate-invoice', generateInvoiceFromQuoteCtrl);
// POST /quotes/:id/send-email - Enviar cotización por correo
quoteRoutes.post('/:id/send-email', sendClientQuoteEmailCtrl);
// POST /quotes/:id/approve - Aprobar cotización (Cliente)
quoteRoutes.post('/:id/approve', approveQuoteCtrl);
// Comentarios (Cliente)
quoteRoutes.get('/:id/comments', listCommentsByQuoteCtrl);
quoteRoutes.post('/:id/comments', createCommentCtrl);
quoteRoutes.put('/comments/:commentId', updateCommentCtrl);
quoteRoutes.delete('/comments/:commentId', deleteCommentCtrl);
export default quoteRoutes;
