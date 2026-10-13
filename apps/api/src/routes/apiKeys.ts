import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listApiKeys, createApiKey, deleteApiKey } from '../controllers/apiKeys';

const router = Router();
router.use(requireAuth);

router.get('/', listApiKeys);
router.post('/', createApiKey);
router.delete('/:id', deleteApiKey);

export default router;
