import { Currency, CurrencyAmounts } from '@swiftspend/types';

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
  amounts: CurrencyAmounts;
  category: Category | null;
}

export interface MonthlyTotal {
  year: number;
  month: number;
  default_currency: string;
  totals: Partial<Record<Currency, number>>;
  previous_totals?: Partial<Record<Currency, number>>;
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
