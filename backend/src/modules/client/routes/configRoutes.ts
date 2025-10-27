


import { Router } from 'express'
import { listRoles, listUsers } from '../controllers/clientController.js'


const configRoutes = Router()

configRoutes.get('/roles', listRoles)
configRoutes.get('/users', listUsers)


export default configRoutes
