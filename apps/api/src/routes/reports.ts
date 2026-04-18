import { Router } from 'express';
import {
  getDailyReport,
  getMonthlyReport,
  getYearlyReport
} from '../controllers/reports';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/daily', getDailyReport);
router.get('/monthly', getMonthlyReport);
router.get('/yearly', getYearlyReport);

export default router;
