import { Category } from './api';
import { ReportCategory } from './reports';

export type SearchType = 'category' | 'date' | 'month' | 'year' | 'quick';

export type QuickFilter = 'this-month' | 'this-year' | 'last-30-days';

export interface ParsedSearch {
  type: SearchType;
  label: string;
  from: string;
  to: string;
  year?: number;
  month?: number;
  date?: string;
  category?: Category;
  quickFilter?: QuickFilter;
}

export interface CategoryTrend {
  id: string | null;
  name: string;
  icon: string;
  changePercent: number;
  direction: 'up' | 'down' | 'same';
}

export interface MerchantItem {
  name: string;
  categoryName: string;
  categoryIcon: string;
  total: number;
}

export interface DensityDay {
  day: number;
  amount: number;
  date: string;
  isInPeriod: boolean;
  // Map of category name to amount spent on that day
  categories?: Record<string, number>;
}

export interface AnalyticsData {
  label: string;
  searchType: SearchType;
  hasData: boolean;
  total: number;
  dailyAverage: number;
  noSpendStreak: number;
  categories: ReportCategory[];
  trends: CategoryTrend[] | null;
  merchants: MerchantItem[];
  showCategoryBreakdown: boolean;
  showTrends: boolean;
}
