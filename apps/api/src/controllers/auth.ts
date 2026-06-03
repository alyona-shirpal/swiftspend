import { Response, NextFunction } from 'express'
import { z } from 'zod'
import { AuthRequest } from '../middleware/auth'
import { supabaseAdmin } from '../services/supabase'

const DeleteSchema = z.object({
  password: z.string().min(1, "Password is required")
})

export const deleteAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { password } = DeleteSchema.parse(req.body)
    const userId = req.user!.id
    const email = req.user!.email

    if (!email) {
      return res.status(400).json({ error: 'User email not found' })
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    })

    if (signInError) {
      return res.status(401).json({ error: 'Invalid password' })
    }

    // Delete the user from Supabase Auth
    // Note: Due to foreign key constraints with ON DELETE CASCADE, 
    // all related user_profiles, user_currencies, categories, and expenses will be deleted.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return res.status(500).json({ error: 'Failed to delete user account' })
    }

    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
