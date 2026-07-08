import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ExchangeRateService } from '../services/exchangeRate';
import { createSupabaseUserClient } from '../services/supabase';

export const getLatestRates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const supabase = createSupabaseUserClient(req.accessToken!);
    const snapshot = await ExchangeRateService.getCachedRates(supabase);
    
    res.json({
      base: snapshot.base,
      rates: snapshot.rates,
      fetched_at: snapshot.fetched_at
    });
  } catch (error) {
    next(error);
  }
};
