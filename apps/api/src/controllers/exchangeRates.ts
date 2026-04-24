import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ExchangeRateService } from '../services/exchangeRate';

export const getLatestRates = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { rates, fetchedAt } = await ExchangeRateService.getCachedRates();
    
    res.json({
      base: 'EUR', // Per prompt, default UI response is EUR or rather, the rates object
      rates,
      fetched_at: fetchedAt
    });
  } catch (error) {
    next(error);
  }
};
