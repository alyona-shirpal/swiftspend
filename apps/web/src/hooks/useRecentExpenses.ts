import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { RecentExpense } from '../types/api';
import { supabase } from '../services/supabase';
import { Currency } from '@swiftspend/types';

export function useRecentExpenses() {
  return useQuery({
    queryKey: ['expenses', 'recent'],
    queryFn: async (): Promise<RecentExpense[]> => {
      // Development mode - return mock data
      if (!supabase) {
        const today = new Date().toISOString().split('T')[0]!;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]!;
        
        return [
          {
            id: '1',
            merchant: 'Cafe Milano',
            description: 'Lunch at Cafe Milano',
            date: today,
            time: '12:30',
            amount: 15.50,
            currency: Currency.EUR,
            amounts: { EUR: 15.50, ALL: 1850, USD: 16.75, UAH: 620 },
            category: { id: '1', name: 'Food & Dining', icon: 'restaurant', color: '#FF6B6B' }
          },
          {
            id: '2',
            merchant: 'Uber',
            description: 'Uber ride to office',
            date: today,
            time: '09:15',
            amount: 12.00,
            currency: Currency.EUR,
            amounts: { EUR: 12.00, ALL: 1430, USD: 13.00, UAH: 480 },
            category: { id: '2', name: 'Transportation', icon: 'directions_car', color: '#4ECDC4' }
          },
          {
            id: '3',
            merchant: 'Coffee House',
            description: 'Coffee subscription',
            date: yesterday,
            time: '08:00',
            amount: 8.99,
            currency: Currency.EUR,
            amounts: { EUR: 8.99, ALL: 1070, USD: 9.75, UAH: 360 },
            category: { id: '4', name: 'Coffee', icon: 'local_cafe', color: '#8B4513' }
          },
        ];
      }

      const { data } = await api.get('/expenses/recent');
      return data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
