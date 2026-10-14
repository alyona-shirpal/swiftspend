import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getMonobankStatus,
  connectMonobank,
  disconnectMonobank,
  getPendingImports,
  acceptPendingImport,
  declinePendingImport,
  clearAllPendingImports,
  handleMonobankWebhook,
  validateMonobankWebhook,
  syncMonobankStatement,
  verifyMonobankWebhook,
} from '../controllers/monobankIntegrations';

const router = Router();

// Public webhook routes (no auth)
router.get('/webhook/:webhookToken', validateMonobankWebhook);
router.post('/webhook/:webhookToken', handleMonobankWebhook);

// Authenticated routes
router.use(requireAuth);
router.get('/status', getMonobankStatus);
router.post('/connect', connectMonobank);
router.get('/pending', getPendingImports);
router.post('/pending/clear', clearAllPendingImports);
router.post('/pending/:id/accept', acceptPendingImport);
router.post('/pending/:id/decline', declinePendingImport);
router.delete('/:id', disconnectMonobank);
router.post('/:id/sync', syncMonobankStatement);
router.post('/:id/webhook/verify', verifyMonobankWebhook);

export default router;
