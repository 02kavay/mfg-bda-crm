import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  createLead,
  getLeads,
  updateLead,
  deleteLead,
  createCommunicationLog,
  getCommunicationLogs
} from '../controllers/lead.controller';

const router = Router();

router.use(authenticate);

// Leads operations
router.post('/', createLead);
router.get('/', getLeads);
router.patch('/:id', updateLead);
router.delete('/:id', deleteLead);

// Communication logs operations
router.post('/communications', createCommunicationLog);
router.get('/communications/:leadId', getCommunicationLogs);

export default router;
