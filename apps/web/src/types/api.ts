import { Currency } from '@swiftspend/types';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface RecentExpense {
  id: string;
  description: string | null;
  date: string;
  time: string;
  amount: number;
  currency: Currency;
  amount_eur: number;
  category: Category | null;
}

export interface MonthlyTotal {
  year: number;
  month: number;
  default_currency: 'EUR';
  totals: {
    UAH: number;
    ALL: number;
    EUR: number;
    USD: number;
  };
  comparison: {
    previous_month_eur: number;
    change_percent: number;
    direction: 'up' | 'down' | 'same';
  };
}

export interface ExchangeRatesSnapshot {
  base: 'EUR';
  rates: {
    UAH: number;
    ALL: number;
    EUR: number;
    USD: number;
  };
  fetched_at: string;
}
