import { Router } from 'express';
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getRecentExpenses
} from '../controllers/expenses';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/recent', getRecentExpenses);
router.get('/', getExpenses);
router.get('/:id', getExpense);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
