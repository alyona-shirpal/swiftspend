import { Router } from 'express';
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getRecentExpenses,
  getNoteSuggestions,
  getMerchantSuggestions,
  getMonthlyTotal
} from '../controllers/expenses';
import { requireAuth } from '../middleware/auth';
import { getDocumentExpenseConfig, processExpenseDocument } from '../controllers/documentExpenses';
import express from 'express';

const router = Router();
router.use(requireAuth);

router.get('/recent', getRecentExpenses);
router.get('/monthly-total', getMonthlyTotal);
router.get('/note-suggestions', getNoteSuggestions);
router.get('/merchant-suggestions', getMerchantSuggestions);
router.get('/document/config', getDocumentExpenseConfig);
router.post('/document', express.raw({ type: '*/*', limit: '15mb' }), processExpenseDocument);
router.get('/', getExpenses);
router.get('/:id', getExpense);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
