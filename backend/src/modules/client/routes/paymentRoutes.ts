import { Router } from 'express'
import {
  listClientPaymentsCtrl,
  createPaymentCtrl,
  getClientPaymentDetailCtrl,
  listPaymentMethodsCtrl,
  listClientInvoicesCtrl,
} from '../controllers/paymentController.js'

const paymentRoutes = Router()

// GET /payments - Listar todos los pagos del cliente
paymentRoutes.get('/', listClientPaymentsCtrl)

// GET /payments/methods - Obtener métodos de pago disponibles
paymentRoutes.get('/methods', listPaymentMethodsCtrl)

// GET /payments/invoices - Obtener facturas del cliente para vincular
paymentRoutes.get('/invoices', listClientInvoicesCtrl)

// GET /payments/:id - Ver detalle de un pago específico
paymentRoutes.get('/:id', getClientPaymentDetailCtrl)

// POST /payments - Crear un nuevo pago (similar al admin)
paymentRoutes.post('/', createPaymentCtrl)

// POST /payments/process - Realizar un pago (compatibilidad con endpoint anterior)
paymentRoutes.post('/process', createPaymentCtrl)

export default paymentRoutes
