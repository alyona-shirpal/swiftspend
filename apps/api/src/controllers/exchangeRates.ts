import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ExchangeRateService } from '../services/exchangeRate';

export const getLatestRates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const snapshot = await ExchangeRateService.getCachedRates();
    
    res.json({
      base: snapshot.base,
      rates: snapshot.rates,
      fetched_at: snapshot.fetched_at
    });
  } catch (error) {
    next(error);
  }
};
