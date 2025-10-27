import { Router } from 'express'
import {
  listClientPaymentsCtrl,
  createPaymentCtrl,
  getClientPaymentDetailCtrl,
} from '../controllers/paymentController.js'

const paymentRoutes = Router()

// GET /payments - Listar todos los pagos del cliente
paymentRoutes.get('/', listClientPaymentsCtrl)

// GET /payments/:id - Ver detalle de un pago específico
paymentRoutes.get('/:id', getClientPaymentDetailCtrl)

// POST /payments/process - Realizar un pago
paymentRoutes.post('/process', createPaymentCtrl)

export default paymentRoutes
