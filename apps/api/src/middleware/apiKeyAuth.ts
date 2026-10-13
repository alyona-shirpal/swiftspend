import crypto from 'crypto';
import { Response, NextFunction } from 'express';
import { supabaseAdmin } from '../services/supabase';
import { AuthRequest } from '../types/auth';

export const requireApiKey = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let apiKeyStr: string | undefined;

  const headerKey = req.headers['x-api-key'];
  if (typeof headerKey === 'string' && headerKey.trim()) {
    apiKeyStr = headerKey.trim();
  } else {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer sk_live_')) {
      const parts = authHeader.split(' ');
      if (parts[1]) {
        apiKeyStr = parts[1].trim();
      }
    }
  }

  if (!apiKeyStr) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'MISSING_API_KEY',
      message: 'Valid API Key required (via X-API-Key header or Bearer sk_live_...)'
    });
  }

  try {
    const keyHash = crypto.createHash('sha256').update(apiKeyStr).digest('hex');

    const { data: apiKeyRecord, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('id, user_id')
      .eq('key_hash', keyHash)
      .single();

    if (keyError || !apiKeyRecord) {
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'INVALID_API_KEY',
        message: 'The provided API key is invalid or revoked'
      });
    }

    // Attach user information
    req.user = {
      id: apiKeyRecord.user_id,
    };

    // Update last_used_at timestamp asynchronously
    supabaseAdmin
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyRecord.id)
      .then();

    next();
  } catch (error) {
    console.error('API key auth middleware error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'INTERNAL_AUTH_ERROR',
      message: 'An error occurred during API key authentication'
    });
  }
};

export const requireAuthOrApiKey = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const headerKey = req.headers['x-api-key'];
  const authHeader = req.headers.authorization;

  if ((typeof headerKey === 'string' && headerKey.trim()) || (authHeader && authHeader.startsWith('Bearer sk_live_'))) {
    return requireApiKey(req, res, next);
  }

  const { requireAuth } = await import('./auth');
  return requireAuth(req, res, next);
};
