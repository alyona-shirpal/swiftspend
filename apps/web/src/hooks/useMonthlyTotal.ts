import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { MonthlyTotal } from '../types/api';

export function useMonthlyTotal(year?: number, month?: number) {
  return useQuery({
    queryKey: ['expenses', 'monthly-total', year, month],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      if (month) params.append('month', month.toString());
      
      const { data } = await api.get<MonthlyTotal>(`/expenses/monthly-total?${params.toString()}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
