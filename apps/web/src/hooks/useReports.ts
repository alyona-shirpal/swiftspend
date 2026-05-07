import { useQuery } from '@tanstack/react-query';
import { DailyReportResponse, MonthlyReportResponse, YearlyReportResponse } from '../types/reports';
import api from '../services/api';

export function useDailyReport(date: string, currency?: string) {
  return useQuery({
    queryKey: ['reports', 'daily', date, currency],
    queryFn: async (): Promise<DailyReportResponse> => {
      const params = new URLSearchParams({ date });
      if (currency) params.append('currency', currency);
      
      const response = await api.get(`/reports/daily?${params}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMonthlyReport(year: string, month: string, currency?: string) {
  return useQuery({
    queryKey: ['reports', 'monthly', year, month, currency],
    queryFn: async (): Promise<MonthlyReportResponse> => {
      const params = new URLSearchParams({ year, month });
      if (currency) params.append('currency', currency);
      
      const response = await api.get(`/reports/monthly?${params}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useYearlyReport(year: string, currency?: string) {
  return useQuery({
    queryKey: ['reports', 'yearly', year, currency],
    queryFn: async (): Promise<YearlyReportResponse> => {
      const params = new URLSearchParams({ year });
      if (currency) params.append('currency', currency);
      
      const response = await api.get(`/reports/yearly?${params}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
