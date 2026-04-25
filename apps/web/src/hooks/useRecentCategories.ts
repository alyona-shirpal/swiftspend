import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Category } from '../types/api';

export function useRecentCategories() {
  return useQuery({
    queryKey: ['categories', 'recent'],
    queryFn: async () => {
      const { data } = await api.get<Category[]>('/categories/recent');
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
