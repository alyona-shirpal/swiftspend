import { useQuery } from '@tanstack/react-query';
import { exchangeRatesService } from '../services/exchangeRates';

export const useExchangeRates = () => {
  return useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => exchangeRatesService.getLatest(),
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
    refetchOnWindowFocus: false,
  });
};
