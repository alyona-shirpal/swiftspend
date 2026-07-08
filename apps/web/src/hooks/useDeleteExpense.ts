import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import api from '../services/api';
import { supabase } from '../services/supabase';
import type { ExpensesPage } from './useAllExpenses';

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseId: string) => {
      if (!supabase) {
        console.log('Development mode: Simulating expense deletion', expenseId);
        return expenseId;
      }

      await api.delete(`/expenses/${expenseId}`);
      return expenseId;
    },
    onSuccess: (expenseId) => {
      queryClient.setQueriesData({ queryKey: ['expenses', 'recent'] }, (previous: unknown) => {
        if (!Array.isArray(previous)) return previous;
        return previous.filter((expense) => {
          return !expense || typeof expense !== 'object' || !('id' in expense) || expense.id !== expenseId;
        });
      });

      queryClient.setQueriesData<InfiniteData<ExpensesPage>>({ queryKey: ['expenses', 'all'] }, (previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          pages: previous.pages.map((page) => ({
            ...page,
            total: Math.max(0, page.total - 1),
            expenses: page.expenses.filter((expense) => expense.id !== expenseId),
          })),
        };
      });

      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      if (!supabase) return;

      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'recent'] });
    },
  });
}
