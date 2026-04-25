import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { RecentExpense } from '../types/api';

export function useRecentExpenses() {
  return useQuery({
    queryKey: ['expenses', 'recent'],
    queryFn: async () => {
      const { data } = await api.get<RecentExpense[]>('/expenses/recent');
      return data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
