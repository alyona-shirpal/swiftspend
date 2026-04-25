import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { ExchangeRatesSnapshot } from '../types/api';

export function useExchangeRates() {
  return useQuery({
    queryKey: ['exchange-rates', 'latest'],
    queryFn: async () => {
      const { data } = await api.get<ExchangeRatesSnapshot>('/exchange-rates/latest');
      return data;
    },
    staleTime: 55 * 60 * 1000, // 55 minutes
  });
}
