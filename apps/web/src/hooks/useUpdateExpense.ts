import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Currency } from '@swiftspend/types';
import api from '../services/api';
import { supabase } from '../services/supabase';

interface UpdateExpensePayload {
  id: string;
  amount: number;
  currency: Currency;
  category_id?: string | null;
  description?: string;
  date?: string;
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateExpensePayload) => {
      if (!supabase) {
        console.log('Development mode: Simulating expense update', { id, ...payload });
        return { id, ...payload };
      }

      const { data } = await api.put(`/expenses/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'recent'] });
    },
  });
}
