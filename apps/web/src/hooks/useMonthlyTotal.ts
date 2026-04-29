import { useQuery } from '@tanstack/react-query';
import { getMockMonthlyTotal } from '../services/mockExpenses';

export function useMonthlyTotal(year?: number, month?: number) {
  return useQuery({
    queryKey: ['expenses', 'monthly-total', year, month],
    queryFn: async () => getMockMonthlyTotal(year, month),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
