import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Currency } from '@swiftspend/types';
import api from '../services/api';
import { supabase } from '../services/supabase';

interface AddExpensePayload {
  amount: number;
  currency: Currency;
  category_id?: string;
  description?: string;
  date?: string;
}

export function useAddExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddExpensePayload) => {
      // Development mode - simulate successful expense creation
      if (!supabase) {
        console.log('Development mode: Simulating expense creation', payload);
        return { id: `mock-expense-${Date.now()}`, ...payload };
      }

      const { data } = await api.post('/expenses', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', 'recent'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'monthly-total'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'recent'] });
    },
  });
}
