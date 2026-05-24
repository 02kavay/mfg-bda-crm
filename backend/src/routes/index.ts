import { Router } from 'express';
import authRoutes from './auth.routes';
import leadRoutes from './lead.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
