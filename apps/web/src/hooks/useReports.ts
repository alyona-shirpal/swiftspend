import { useQuery } from '@tanstack/react-query';
import { expensesService } from '../services/expenses';

export const useDailyReport = (date: string) => {
  return useQuery({
    queryKey: ['reports', 'daily', date],
    queryFn: () => expensesService.getDailyReport(date),
  });
};

export const useMonthlyReport = (month: string, year: number) => {
  return useQuery({
    queryKey: ['reports', 'monthly', month, year],
    queryFn: () => expensesService.getMonthlyReport(month, year),
  });
};

export const useYearlyReport = (year: number) => {
  return useQuery({
    queryKey: ['reports', 'yearly', year],
    queryFn: () => expensesService.getYearlyReport(year),
  });
};
