import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../services/supabase';
import { AuthRequest } from '../types/auth';

export const extractApiKeyString = (req: Request): string | undefined => {
  const headerKey = req.headers['x-api-key'];
  if (typeof headerKey === 'string' && headerKey.trim()) {
    return headerKey.trim();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string') {
    const trimmed = authHeader.trim();
    if (trimmed.startsWith('Bearer ')) {
      const token = trimmed.slice(7).trim();
      if (token) return token;
    }
  }

  const query = (req.query || {}) as Record<string, any>;
  const queryKey = query.apiKey || query.api_key || query.token;
  if (typeof queryKey === 'string' && queryKey.trim()) {
    return queryKey.trim();
  }

  return undefined;
};

export const validateApiKey = async (apiKeyStr: string): Promise<{ userId: string; keyId: string } | null> => {
  if (!apiKeyStr) return null;
  try {
    const keyHash = crypto.createHash('sha256').update(apiKeyStr).digest('hex');
    const { data: apiKeyRecord, error: keyError } = await supabaseAdmin
      .from('api_keys')
      .select('id, user_id')
      .eq('key_hash', keyHash)
      .single();

    if (keyError || !apiKeyRecord) {
      return null;
    }

    // Update last_used_at timestamp asynchronously
    supabaseAdmin
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyRecord.id)
      .then();

    return {
      userId: apiKeyRecord.user_id,
      keyId: apiKeyRecord.id,
    };
  } catch (err) {
    console.error('Error validating API key:', err);
    return null;
  }
};

export const requireApiKey = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const apiKeyStr = extractApiKeyString(req);

  if (!apiKeyStr) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'MISSING_API_KEY',
      message: 'Valid API Key required (via X-API-Key header, Bearer token, or apiKey query param)',
    });
  }

  const result = await validateApiKey(apiKeyStr);
  if (!result) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'INVALID_API_KEY',
      message: 'The provided API key is invalid or revoked',
    });
  }

  req.user = {
    id: result.userId,
  };
  next();
};

export const requireAuthOrApiKey = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const apiKeyStr = extractApiKeyString(req);
  if (apiKeyStr && apiKeyStr.startsWith('sk_live_')) {
    return requireApiKey(req, res, next);
  }

  const { requireAuth } = await import('./auth');
  return requireAuth(req, res, next);
};
