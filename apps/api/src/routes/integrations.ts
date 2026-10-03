import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getGoogleStatus, connectGoogle, syncToGoogle, disconnectGoogle } from '../controllers/integrations';

const router = Router();

// SYNC_SPEC_V1: All integration routes require an authenticated user.
router.use(requireAuth);

router.get('/google/status', getGoogleStatus);
router.post('/google/connect', connectGoogle);
router.post('/google/sync', syncToGoogle);
router.delete('/google', disconnectGoogle);

export default router;
