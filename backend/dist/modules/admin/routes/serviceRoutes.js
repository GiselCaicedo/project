import { Router } from 'express';
import { createServiceCtrl, deleteServiceCtrl, getServiceByIdCtrl, listServiceCategoriesCtrl, listServicesCtrl, updateServiceCtrl, } from '../controllers/serviceController.js';
import { listServiceRequestsCtrl, updateServiceRequestCtrl } from '../controllers/serviceRequestController.js';
const serviceRoutes = Router();
serviceRoutes.get('/', listServicesCtrl);
serviceRoutes.get('/categories', listServiceCategoriesCtrl);
// Requests endpoints must be before dynamic :id route
serviceRoutes.get('/requests', listServiceRequestsCtrl);
serviceRoutes.patch('/requests/:id', updateServiceRequestCtrl);
serviceRoutes.post('/', createServiceCtrl);
serviceRoutes.get('/:id', getServiceByIdCtrl);
serviceRoutes.put('/:id', updateServiceCtrl);
serviceRoutes.delete('/:id', deleteServiceCtrl);
export default serviceRoutes;
