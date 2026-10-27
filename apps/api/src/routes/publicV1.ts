import { Router } from 'express';
import { requireAuthOrApiKey } from '../middleware/apiKeyAuth';
import {
  publicCreateExpense,
  publicGetExpenses,
  publicGetCategories,
  publicUpdateExpense,
} from '../controllers/publicV1';

const router = Router();
router.use(requireAuthOrApiKey);

router.post('/expenses', publicCreateExpense);
router.get('/expenses', publicGetExpenses);
router.put('/expenses/:id', publicUpdateExpense);
router.patch('/expenses/:id', publicUpdateExpense);
router.get('/categories', publicGetCategories);

export default router;
