
import { Router } from 'express'
import { listRoles, listUsers } from '../controllers/clientController.js'
import { getCompanyProfile, updateCompanyProfile } from '../controllers/companyController.js'

const configRoutes = Router()

configRoutes.get('/roles', listRoles)
configRoutes.get('/users', listUsers)
configRoutes.get('/company/profile', getCompanyProfile)
configRoutes.put('/company/profile', updateCompanyProfile)

export default configRoutes
