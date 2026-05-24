import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { getDashboardStats } from '../controllers/dashboard.controller';

const router = Router();

router.get('/stats', authenticate, getDashboardStats);

export default router;
