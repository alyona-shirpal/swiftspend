import { useQuery } from '@tanstack/react-query';
import { getMockRecentCategories } from '../services/mockExpenses';

export function useRecentCategories() {
  return useQuery({
    queryKey: ['categories', 'recent'],
    queryFn: async () => getMockRecentCategories(),
    initialData: [],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
