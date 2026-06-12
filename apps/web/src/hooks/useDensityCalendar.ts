import { useQuery } from '@tanstack/react-query';
import { Currency } from '@swiftspend/types';
import { fetchAllExpenses } from '../services/expenses';
import { buildMonthDensity } from '../utils/analyticsCompute';
import { Category } from '../types/api';

export function useDensityCalendar(
  year: number,
  month: number,
  currency: Currency,
  categoryId?: string,
  highlightDate?: string,
  categories: Category[] = []
) {
  return useQuery({
    queryKey: ['analytics', 'density', year, month, currency, categoryId, highlightDate, categories],
    queryFn: async () => {
      const from = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const expenses = await fetchAllExpenses({
        from,
        to,
        categoryId,
      });

      const highlight =
        highlightDate && highlightDate.startsWith(`${year}-${String(month).padStart(2, '0')}`)
          ? highlightDate
          : undefined;

      return buildMonthDensity(expenses, currency, year, month, highlight, categories);
    },
    staleTime: 2 * 60 * 1000,
  });
}
