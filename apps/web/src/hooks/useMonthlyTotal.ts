import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { MonthlyTotal } from '../types/api';
import { supabase } from '../services/supabase';

export function useMonthlyTotal(year?: number, month?: number) {
  return useQuery({
    queryKey: ['expenses', 'monthly-total', year, month],
    queryFn: async (): Promise<MonthlyTotal> => {
      // Development mode - return mock data
      if (!supabase) {
        const currentDate = new Date();
        const mockYear = year || currentDate.getFullYear();
        const mockMonth = month || currentDate.getMonth() + 1;
        
        return {
          totals: { EUR: 1250.50, ALL: 150000, USD: 1350, UAH: 50000 },
          previous_totals: { EUR: 1480.75, ALL: 177000, USD: 1600, UAH: 59000 },
          comparison: {
            direction: 'down' as const,
            change_percent: 15.5,
            previous_month_eur: 1480.75
          },
          year: mockYear,
          month: mockMonth,
          default_currency: 'EUR'
        };
      }

      const { data } = await api.get('/expenses/monthly-total', {
        params: { year, month }
      });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
