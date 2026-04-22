import { Currency } from '@swiftspend/types';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  totalSpentMonth: Record<Currency, number>;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  currency: Currency;
  description?: string;
  date: string;
  amounts: Record<Currency, number>; // Converted amounts in all 4 currencies
  category?: Category;
  createdAt: string;
}

export interface ExchangeRate {
  base: Currency;
  rates: Record<Currency, number>;
  updatedAt: string;
}

export interface ReportCategoryBreakdown {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  totalAmount: Record<Currency, number>;
  percentage: number;
}

export interface DailyReport {
  date: string;
  totalAmount: Record<Currency, number>;
  categories: ReportCategoryBreakdown[];
  expenses: Expense[];
}

export interface MonthlyReport {
  month: string;
  year: number;
  totalAmount: Record<Currency, number>;
  dailyAverage: Record<Currency, number>;
  categories: ReportCategoryBreakdown[];
  dailySpending: { date: string; amount: Record<Currency, number> }[];
}

export interface YearlyReport {
  year: number;
  totalAmount: Record<Currency, number>;
  categories: ReportCategoryBreakdown[];
  monthlySpending: { month: string; amount: Record<Currency, number> }[];
}
