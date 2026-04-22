import api from './api';
import { ExchangeRate } from '../types/api';

export const exchangeRatesService = {
  getLatest: async (): Promise<ExchangeRate> => {
    const { data } = await api.get('/exchange-rates/latest');
    return data;
  },
};
