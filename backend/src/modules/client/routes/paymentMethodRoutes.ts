import { Router } from 'express'
import {
  listPaymentMethodsCtrl,
  getPaymentMethodByIdCtrl,
} from '../controllers/paymentMethodController.js'

const paymentMethodRoutes = Router()

// GET /payment-methods - Listar todos los métodos de pago disponibles
paymentMethodRoutes.get('/', listPaymentMethodsCtrl)

// GET /payment-methods/:id - Obtener un método de pago específico
paymentMethodRoutes.get('/:id', getPaymentMethodByIdCtrl)

export default paymentMethodRoutes
