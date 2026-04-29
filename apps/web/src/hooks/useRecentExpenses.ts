import { useQuery } from '@tanstack/react-query';
import { getMockExpenses } from '../services/mockExpenses';

export function useRecentExpenses() {
  return useQuery({
    queryKey: ['expenses', 'recent'],
    queryFn: async () => getMockExpenses(),
    initialData: [],
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
