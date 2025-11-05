import { Router } from 'express';
import { getDashboardSummary } from '../controllers/clientController.js';
const dashboardRoutes = Router();
dashboardRoutes.get('/summary', getDashboardSummary);
export default dashboardRoutes;
