import { useQuery } from '@tanstack/react-query';
import type { Category } from '../types/api';
import api from '../services/api';
import { supabase } from '../services/supabase';
import { sortCategoriesByLastUsed } from '../utils/categorySorting';

export function useCategories() {
  return useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async (): Promise<Category[]> => {
      // Development mode - return mock data
      if (!supabase) {
        return sortCategoriesByLastUsed([
          { id: '1', name: 'Food & Dining', icon: 'restaurant', color: '#FF6B6B', last_used_at: '2026-07-08T08:30:00.000Z' },
          { id: '2', name: 'Transportation', icon: 'directions_car', color: '#4ECDC4', last_used_at: '2026-07-07T16:15:00.000Z' },
          { id: '3', name: 'Shopping', icon: 'shopping_bag', color: '#45B7D1', last_used_at: null },
          { id: '4', name: 'Entertainment', icon: 'movie', color: '#96CEB4', last_used_at: null },
          { id: '5', name: 'Bills & Utilities', icon: 'receipt', color: '#FFEAA7', last_used_at: null },
          { id: '6', name: 'Healthcare', icon: 'medical_services', color: '#DDA0DD', last_used_at: null },
          { id: '7', name: 'Education', icon: 'school', color: '#98D8C8', last_used_at: null },
          { id: '8', name: 'Travel', icon: 'flight', color: '#F7DC6F', last_used_at: null },
        ]);
      }

      const { data } = await api.get('/categories');
      return sortCategoriesByLastUsed(data);
    },
  });
}
