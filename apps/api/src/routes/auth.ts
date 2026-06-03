import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { deleteAccount } from '../controllers/auth'

const router = Router()
router.use(requireAuth)

router.delete('/user', deleteAccount)

export default router
