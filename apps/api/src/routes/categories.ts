import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getRecentCategories,
  completeCategoryOnboarding
} from '../controllers/categories';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/recent', getRecentCategories);
router.post('/complete-onboarding', completeCategoryOnboarding);
router.get('/', getCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
