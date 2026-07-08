import { useInfiniteQuery } from '@tanstack/react-query';
import api from '../services/api';
import { RecentExpense, Category } from '../types/api';
import { supabase } from '../services/supabase';
import { Currency, Expense } from '@swiftspend/types';

const PAGE_SIZE = 50;

export interface ExpensesPage {
  expenses: RecentExpense[];
  total: number;
  page: number;
  limit: number;
}

interface UseAllExpensesParams {
  search?: string;
  categoryId?: string;
}

function mapExpense(e: Expense, categoryMap: Map<string, Category>): RecentExpense {
  return {
    id: e.id,
    description: e.description,
    date: e.date,
    time: e.created_at || e.date,
    amount: e.amount,
    currency: e.currency as Currency,
    amounts: e.amounts || {},
    category: e.category_id ? categoryMap.get(e.category_id) || null : null,
  };
}

export function useAllExpenses(params: UseAllExpensesParams = {}) {
  const search = params.search?.trim() ?? '';
  const categoryId = params.categoryId && params.categoryId !== 'all' ? params.categoryId : undefined;

  return useInfiniteQuery({
    queryKey: ['expenses', 'all', { search, categoryId }],
    initialPageParam: 1,
    queryFn: async ({ pageParam }): Promise<ExpensesPage> => {
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
        
        const mockExpenses: RecentExpense[] = [
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

        const filtered = mockExpenses.filter((expense) => {
          const matchesSearch =
            !search ||
            expense.description?.toLowerCase().includes(search.toLowerCase()) ||
            expense.category?.name.toLowerCase().includes(search.toLowerCase());
          const matchesCategory = !categoryId || expense.category?.id === categoryId;

          return matchesSearch && matchesCategory;
        });

        const start = (pageParam - 1) * PAGE_SIZE;
        const expenses = filtered.slice(start, start + PAGE_SIZE);

        return {
          expenses,
          total: filtered.length,
          page: pageParam,
          limit: PAGE_SIZE,
        };
      }

      const searchParams = new URLSearchParams({
        page: String(pageParam),
        limit: String(PAGE_SIZE),
      });
      if (search) searchParams.set('search', search);
      if (categoryId) searchParams.set('category_id', categoryId);

      const { data } = await api.get(`/expenses?${searchParams}`);
      const mapped = (data.data as Expense[]).map((expense) => mapExpense(expense, categoryMap));
      const expenses = mapped.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time.includes('T') ? a.time.split('T')[1] : '00:00:00'}`);
        const dateB = new Date(`${b.date}T${b.time.includes('T') ? b.time.split('T')[1] : '00:00:00'}`);
        return dateB.getTime() - dateA.getTime();
      });

      return {
        expenses,
        total: data.metadata.total,
        page: data.metadata.page,
        limit: data.metadata.limit,
      };
    },
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.limit;
      return loaded < lastPage.total && lastPage.expenses.length > 0 ? lastPage.page + 1 : undefined;
    },
    staleTime: 1 * 60 * 1000,
  });
}
