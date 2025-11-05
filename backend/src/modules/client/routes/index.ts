import { Router } from 'express'
import { authenticate } from '../../../middlewares/authenticate.js'
import serviceRoutes from './serviceRoutes.js'
import dashboardRoutes from './dashboardRoutes.js'
import configRoutes from './configRoutes.js'
import quoteRoutes from './quoteRoutes.js'
import invoiceRoutes from './invoiceRoutes.js'
import paymentRoutes from './paymentRoutes.js'
import paymentMethodRoutes from './paymentMethodRoutes.js'
import reportRoutes from './reportRoutes.js'
import { getCompanyProfile, updateCompanyProfile } from '../controllers/companyController.js'

const clientRoutes = Router()

clientRoutes.get('/health', (_req, res) => {
  res.json({ status: 'OK', scope: 'client' })
})

clientRoutes.use(authenticate)

clientRoutes.use('/dashboard', dashboardRoutes)
clientRoutes.use('/services', serviceRoutes)
clientRoutes.use('/config', configRoutes)
clientRoutes.use('/quotes', quoteRoutes)
clientRoutes.use('/invoices', invoiceRoutes)
clientRoutes.use('/payments', paymentRoutes)
clientRoutes.use('/payment-methods', paymentMethodRoutes)
clientRoutes.use('/reports', reportRoutes)

// Rutas directas para el perfil de empresa del cliente
clientRoutes.get('/company/profile', getCompanyProfile)
clientRoutes.put('/company/profile', updateCompanyProfile)

export default clientRoutes
