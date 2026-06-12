import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { RecentExpense, Category } from '../types/api';
import { supabase } from '../services/supabase';
import { Currency, Expense } from '@swiftspend/types';

export function useAllExpenses() {
  return useQuery({
    queryKey: ['expenses', 'all'],
    queryFn: async (): Promise<RecentExpense[]> => {
      // Fetch categories first to resolve category names/icons/colors
      let categories: Category[] = [];
      try {
        const { data } = await api.get('/categories');
        categories = data;
      } catch (err) {
        console.error('Error fetching categories in useAllExpenses', err);
      }
      const categoryMap = new Map(categories.map((c) => [c.id, c]));

      // Development mode - return mock data
      if (!supabase) {
        const today = new Date().toISOString().split('T')[0]!;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]!;
        const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0]!;
        
        return [
          {
            id: '1',
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
            description: 'Coffee subscription',
            date: yesterday,
            time: '08:00',
            amount: 8.99,
            currency: Currency.EUR,
            amounts: { EUR: 8.99, ALL: 1070, USD: 9.75, UAH: 360 },
            category: { id: '4', name: 'Coffee', icon: 'local_cafe', color: '#8B4513' }
          },
          {
            id: '4',
            description: 'Weekly Groceries',
            date: twoDaysAgo,
            time: '15:45',
            amount: 64.20,
            currency: Currency.EUR,
            amounts: { EUR: 64.20, ALL: 7650, USD: 70.00, UAH: 2560 },
            category: { id: '1', name: 'Food & Dining', icon: 'restaurant', color: '#FF6B6B' }
          },
          {
            id: '5',
            description: 'Movie tickets',
            date: twoDaysAgo,
            time: '20:15',
            amount: 24.00,
            currency: Currency.EUR,
            amounts: { EUR: 24.00, ALL: 2860, USD: 26.00, UAH: 960 },
            category: { id: '4', name: 'Entertainment', icon: 'movie', color: '#96CEB4' }
          }
        ];
      }

      // Fetch all pages of expenses to get the full list
      const allExpenses: Expense[] = [];
      let page = 1;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const { data } = await api.get(`/expenses?page=${page}&limit=${limit}`);
        allExpenses.push(...data.data);
        if (allExpenses.length >= data.metadata.total || data.data.length === 0) {
          hasMore = false;
        } else {
          page++;
        }
      }

      // Map backend Expense to RecentExpense shape and sort from recent to older by date/time
      const mapped = allExpenses.map((e: Expense) => ({
        id: e.id,
        description: e.description,
        date: e.date,
        time: e.created_at || e.date, // fallback
        amount: e.amount,
        currency: e.currency as Currency,
        amounts: e.amounts || {},
        category: e.category_id ? categoryMap.get(e.category_id) || null : null
      }));

      // Sort by date (descending), then by time/created_at (descending)
      return mapped.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time.includes('T') ? a.time.split('T')[1] : '00:00:00'}`);
        const dateB = new Date(`${b.date}T${b.time.includes('T') ? b.time.split('T')[1] : '00:00:00'}`);
        return dateB.getTime() - dateA.getTime();
      });
    },
    staleTime: 1 * 60 * 1000,
  });
}
