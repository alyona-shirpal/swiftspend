import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export interface AvailableCurrency {
  code: string;        // e.g. "EUR"
  name: string;        // e.g. "Euro" from Intl.DisplayNames
  symbol: string;      // e.g. "€" from Intl.NumberFormat
  isPopular: boolean;  // true for EUR USD UAH ALL GBP PLN CZK CHF
}

const POPULAR_CODES = ['EUR', 'USD', 'UAH', 'ALL', 'GBP', 'PLN', 'CZK', 'CHF'];

export function useAvailableCurrencies() {
  return useQuery({
    queryKey: ['available-currencies'],
    queryFn: async () => {
      const { data } = await api.get<{ rates: Record<string, number> }>('/exchange-rates/latest');
      
      const currencyNames = new Intl.DisplayNames(['en'], { type: 'currency' });
      const processed: AvailableCurrency[] = [];

      for (const code of Object.keys(data.rates)) {
        try {
          // Resolve full name
          const name = currencyNames.of(code);
          
          // Resolve symbol
          const symbol = new Intl.NumberFormat('en', {
            style: 'currency',
            currency: code,
          }).formatToParts(0).find(p => p.type === 'currency')?.value;

          if (!name || !symbol) {
             throw new Error(`Incomplete data for ${code}`);
          }

          processed.push({
            code,
            name,
            symbol,
            isPopular: POPULAR_CODES.includes(code),
          });
        } catch (err) {
          console.warn(`Skipping currency code ${code} due to Intl support issues:`, err);
        }
      }

      // Sort: popular first, then alphabetical
      return processed.sort((a, b) => {
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return a.code.localeCompare(b.code);
      });
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
