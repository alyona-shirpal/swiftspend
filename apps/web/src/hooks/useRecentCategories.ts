import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { Category } from '../types/api';
import { supabase } from '../services/supabase';
import { sortCategoriesByLastUsed } from '../utils/categorySorting';

export function useRecentCategories() {
  return useQuery({
    queryKey: ['categories', 'recent'],
    queryFn: async (): Promise<Category[]> => {
      // Development mode - return mock data
      if (!supabase) {
        return sortCategoriesByLastUsed([
          { id: '1', name: 'Food & Dining', icon: 'restaurant', color: '#FF6B6B', last_used_at: '2026-07-08T08:30:00.000Z' },
          { id: '2', name: 'Transportation', icon: 'directions_car', color: '#4ECDC4', last_used_at: '2026-07-07T16:15:00.000Z' },
          { id: '3', name: 'Shopping', icon: 'shopping_bag', color: '#45B7D1', last_used_at: null },
          { id: '4', name: 'Coffee', icon: 'local_cafe', color: '#8B4513', last_used_at: null },
          { id: '5', name: 'Groceries', icon: 'grocery', color: '#228B22', last_used_at: null },
        ]);
      }

      const { data } = await api.get('/categories/recent');
      return sortCategoriesByLastUsed(data);
    },
    initialData: [],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
