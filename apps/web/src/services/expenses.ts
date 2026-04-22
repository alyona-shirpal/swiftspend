import api from './api';
import { Expense, DailyReport, MonthlyReport, YearlyReport } from '../types/api';

export const expensesService = {
  getRecent: async (): Promise<Expense[]> => {
    const { data } = await api.get('/expenses?limit=10');
    return data;
  },

  getAll: async (params: any): Promise<Expense[]> => {
    const { data } = await api.get('/expenses', { params });
    return data;
  },

  getById: async (id: string): Promise<Expense> => {
    const { data } = await api.get(`/expenses/${id}`);
    return data;
  },

  create: async (expense: Partial<Expense>): Promise<Expense> => {
    const { data } = await api.post('/expenses', expense);
    return data;
  },

  update: async (id: string, expense: Partial<Expense>): Promise<Expense> => {
    const { data } = await api.patch(`/expenses/${id}`, expense);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },

  getDailyReport: async (date: string): Promise<DailyReport> => {
    const { data } = await api.get('/reports/daily', { params: { date } });
    return data;
  },

  getMonthlyReport: async (month: string, year: number): Promise<MonthlyReport> => {
    const { data } = await api.get('/reports/monthly', { params: { month, year } });
    return data;
  },

  getYearlyReport: async (year: number): Promise<YearlyReport> => {
    const { data } = await api.get('/reports/yearly', { params: { year } });
    return data;
  },
};
