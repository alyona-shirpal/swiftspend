import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesService } from '../services/expenses';
import { Expense } from '../types/api';

export const useExpenses = (params?: any) => {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: () => expensesService.getAll(params),
  });
};

export const useRecentExpenses = () => {
  return useQuery({
    queryKey: ['expenses', 'recent'],
    queryFn: () => expensesService.getRecent(),
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expense: Partial<Expense>) => expensesService.create(expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};
