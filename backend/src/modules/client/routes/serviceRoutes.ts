


import { Router } from 'express'
import { getClientServiceDetailCtrl, listClientServicesCtrl } from '../controllers/serviceController.js'


const serviceRoutes = Router()

serviceRoutes.get('/', listClientServicesCtrl)
serviceRoutes.get('/:id', getClientServiceDetailCtrl)

export default serviceRoutes
