import crypto from 'crypto';
import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import { supabaseAdmin } from '../services/supabase';

export const listApiKeys = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: keys, error } = await supabaseAdmin
      .from('api_keys')
      .select('id, user_id, name, key_preview, last_used_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing API keys:', error);
      return res.status(500).json({ error: 'Failed to fetch API keys' });
    }

    return res.json({ keys: keys || [] });
  } catch (err) {
    console.error('Error in listApiKeys:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createApiKey = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'API key name is required' });
    }

    const secretBytes = crypto.randomBytes(24).toString('hex');
    const fullApiKey = `sk_live_${secretBytes}`;
    const keyHash = crypto.createHash('sha256').update(fullApiKey).digest('hex');
    const keyPreview = `sk_live_...${fullApiKey.slice(-4)}`;

    const { data: inserted, error } = await supabaseAdmin
      .from('api_keys')
      .insert({
        user_id: userId,
        name: name.trim(),
        key_hash: keyHash,
        key_preview: keyPreview,
      })
      .select('id, name, key_preview, created_at')
      .single();

    if (error || !inserted) {
      console.error('Error creating API key:', error);
      return res.status(500).json({ error: 'Failed to create API key' });
    }

    return res.status(201).json({
      id: inserted.id,
      name: inserted.name,
      key_preview: inserted.key_preview,
      created_at: inserted.created_at,
      api_key: fullApiKey,
    });
  } catch (err) {
    console.error('Error in createApiKey:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteApiKey = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Key ID is required' });
    }

    const { error } = await supabaseAdmin
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting API key:', error);
      return res.status(500).json({ error: 'Failed to delete API key' });
    }

    return res.json({ success: true, message: 'API key revoked successfully' });
  } catch (err) {
    console.error('Error in deleteApiKey:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
