import { useQuery } from '@tanstack/react-query';
import { Currency } from '@swiftspend/types';
import api from '../services/api';
import { supabase } from '../services/supabase';
import { ExpenseDetail } from '../types/api';

export function useExpense(expenseId: string | undefined) {
  return useQuery({
    queryKey: ['expenses', 'detail', expenseId],
    enabled: Boolean(expenseId),
    queryFn: async (): Promise<ExpenseDetail> => {
      if (!expenseId) throw new Error('Expense ID is required');

      if (!supabase) {
        const now = new Date().toISOString();
        return {
          id: expenseId,
          user_id: 'dev-user-id',
          category_id: '1',
          merchant: 'Corner Market',
          normalized_merchant: 'corner market',
          description:
            '2 x Coffee - 6.00 EUR; Butter croissant - 3.50 EUR. Card payment',
          normalized_description:
            '2 x coffee - 6.00 eur; butter croissant - 3.50 eur. card payment',
          date: now.split('T')[0]!,
          created_at: now,
          amount: 9.5,
          currency: Currency.EUR,
          amounts: { EUR: 9.5, USD: 10.33, ALL: 943.2, UAH: 432.1 },
          exchange_rate_snapshot: {
            base: Currency.EUR,
            rates: {},
            fetched_at: now,
          },
          category: {
            id: '1',
            name: 'Coffee',
            icon: 'local_cafe',
            color: '#8B4513',
          },
        };
      }

      const { data } = await api.get<ExpenseDetail>(`/expenses/${expenseId}`);
      return data;
    },
    staleTime: 60 * 1000,
  });
}
