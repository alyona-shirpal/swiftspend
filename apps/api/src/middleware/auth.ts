import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../services/supabase';
import { AuthRequest } from '../types/auth';
export { AuthRequest };

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      code: 'MISSING_TOKEN',
      message: 'Authentication token is required'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      error: 'Unauthorized', 
      code: 'INTERNAL_AUTH_ERROR',
      message: 'An error occurred during authentication'
    });
  }
};
