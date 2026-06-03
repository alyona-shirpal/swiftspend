import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { createUserCurrency, getUserCurrencies, onboardUserCurrencies, setDefaultCurrency, deleteUserCurrency, updateCurrencyPosition } from '../controllers/userCurrencies'

const router = Router()
router.use(requireAuth)

router.get('/', getUserCurrencies)
router.post('/', createUserCurrency)
router.post('/onboarding', onboardUserCurrencies)
router.put('/:currency/default', setDefaultCurrency)
router.put('/:currency/position', updateCurrencyPosition)
router.delete('/:currency', deleteUserCurrency)

export default router

