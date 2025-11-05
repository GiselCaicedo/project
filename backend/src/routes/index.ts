import { Router } from 'express'
import adminRoutes from '../modules/admin/routes/index.js'
import clientRoutes from '../modules/client/routes/index.js'

const apiRoutes = Router()

// Ruta Administrador 
apiRoutes.use('/', adminRoutes)

// Ruta Cliente
apiRoutes.use('/client', clientRoutes)

export default apiRoutes


