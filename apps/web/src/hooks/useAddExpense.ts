import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Currency } from '@swiftspend/types';

interface AddExpensePayload {
  amount: number;
  currency: Currency;
  category_id?: string;
  description?: string;
}

export function useAddExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddExpensePayload) => {
      const { data } = await api.post('/expenses', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', 'recent'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'monthly-total'] });
    },
  });
}
