import { useQuery } from '@tanstack/react-query';
import { Currency } from '@swiftspend/types';
import { AnalyticsData, ParsedSearch } from '../types/analytics';
import { fetchAllExpenses } from '../services/expenses';
import { buildAnalyticsData, getPreviousPeriodRange } from '../utils/analyticsCompute';
import { Category } from '../types/api';

export function useAnalyticsData(
  search: ParsedSearch | null,
  currency: Currency,
  categories: Category[]
) {
  return useQuery({
    queryKey: ['analytics', search, currency],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!search) throw new Error('No search context');

      const categoryId = search.category?.id;
      const expenses = await fetchAllExpenses({
        from: search.from,
        to: search.to,
        categoryId,
      });

      const prevRange = getPreviousPeriodRange(search);
      const previousExpenses = prevRange
        ? await fetchAllExpenses({
            from: prevRange.from,
            to: prevRange.to,
            categoryId,
          })
        : [];

      return buildAnalyticsData(search, expenses, previousExpenses, currency, categories);
    },
    enabled: !!search && categories.length >= 0,
    staleTime: 2 * 60 * 1000,
  });
}
