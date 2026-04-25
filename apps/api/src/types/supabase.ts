import { Currency } from './index';

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
  date: string;
  created_at: string;
  amount: number;
  currency: Currency;
  amount_eur: number | null;
  categories: CategoryRow | null;
};

export type MonthlyAmountsRow = {
  amount_uah: number | null;
  amount_all: number | null;
  amount_eur: number | null;
  amount_usd: number | null;
};

export type PrevMonthEurRow = {
  amount_eur: number | null;
};
