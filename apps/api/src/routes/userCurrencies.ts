import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { createUserCurrency, getUserCurrencies, onboardUserCurrencies } from '../controllers/userCurrencies'

const router = Router()
router.use(requireAuth)

router.get('/', getUserCurrencies)
router.post('/', createUserCurrency)
router.post('/onboarding', onboardUserCurrencies)

export default router

