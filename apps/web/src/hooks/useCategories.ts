import { useQuery } from '@tanstack/react-query';
import type { Category } from '../types/api';
import api from '../services/api';
import { supabase } from '../services/supabase';

export function useCategories() {
  return useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async (): Promise<Category[]> => {
      // Development mode - return mock data
      if (!supabase) {
        return [
          { id: '1', name: 'Food & Dining', icon: 'restaurant', color: '#FF6B6B' },
          { id: '2', name: 'Transportation', icon: 'directions_car', color: '#4ECDC4' },
          { id: '3', name: 'Shopping', icon: 'shopping_bag', color: '#45B7D1' },
          { id: '4', name: 'Entertainment', icon: 'movie', color: '#96CEB4' },
          { id: '5', name: 'Bills & Utilities', icon: 'receipt', color: '#FFEAA7' },
          { id: '6', name: 'Healthcare', icon: 'medical_services', color: '#DDA0DD' },
          { id: '7', name: 'Education', icon: 'school', color: '#98D8C8' },
          { id: '8', name: 'Travel', icon: 'flight', color: '#F7DC6F' },
        ];
      }

      const { data } = await api.get('/categories');
      return data;
    },
  });
}
