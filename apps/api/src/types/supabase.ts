import { Currency } from '@swiftspend/types';

export type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type RecentExpenseCategoryJoinRow = {
  category_id: string | null;
  created_at: string;
  categories: CategoryRow | null;
};

export type RecentExpenseJoinRow = {
  id: string;
  description: string | null;
  normalized_description?: string | null;
  date: string;
  created_at: string;
  amount: number;
  currency: Currency;
  amounts: Record<string, number>;
  categories: CategoryRow | null;
};

export type MonthlyAmountsRow = {
  amounts: Record<string, number>;
};

export type PrevMonthEurRow = {
  amounts: Record<string, number>;
};
