import { Router } from 'express';
import { getClientServiceDetailCtrl, listClientServicesCtrl, listClientServiceObservationsCtrl } from '../controllers/serviceController.js';
import { createClientServiceRequestCtrl, listClientServiceRequestsCtrl } from '../controllers/serviceRequestController.js';
const serviceRoutes = Router();
// Requests endpoints must be before dynamic :id
serviceRoutes.get('/requests', listClientServiceRequestsCtrl);
serviceRoutes.post('/requests', createClientServiceRequestCtrl);
serviceRoutes.get('/', listClientServicesCtrl);
serviceRoutes.get('/:id', getClientServiceDetailCtrl);
serviceRoutes.get('/:id/observations', listClientServiceObservationsCtrl);
export default serviceRoutes;
