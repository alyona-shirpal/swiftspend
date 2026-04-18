import { Router } from 'express';
import { getLatestRates } from '../controllers/exchangeRates';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/latest', getLatestRates);

export default router;
