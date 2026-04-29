import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Currency } from '@swiftspend/types';
import { addMockExpense } from '../services/mockExpenses';

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
    mutationFn: async (payload: AddExpensePayload) => addMockExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', 'recent'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'monthly-total'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'recent'] });
    },
  });
}
