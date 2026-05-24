import { Router } from 'express';
import { register, login, getBDAs } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/bdas', authenticate, getBDAs);

export default router;
