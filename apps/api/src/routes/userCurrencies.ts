import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { createUserCurrency } from '../controllers/userCurrencies'

const router = Router()
router.use(requireAuth)

router.post('/', createUserCurrency)

export default router

