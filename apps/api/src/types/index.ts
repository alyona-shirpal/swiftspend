export enum Currency {
  UAH = 'UAH',
  ALL = 'ALL',
  EUR = 'EUR',
  USD = 'USD'
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

export interface ConversionSnapshot {
  UAH: number;
  ALL: number;
  EUR: number;
  USD: number;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string;
  description: string | null;
  date: string;
  amount: number;
  currency: Currency;
  amount_uah: number;
  amount_all: number;
  amount_eur: number;
  amount_usd: number;
  exchange_rate_snapshot: ConversionSnapshot;
  created_at: string;
}

export interface ReportTotal {
  default_currency: "EUR";
  totals: {
    [Currency.UAH]: number;
    [Currency.ALL]: number;
    [Currency.EUR]: number;
    [Currency.USD]: number;
  };
}

export interface DailyReport extends ReportTotal {
  categories: (ReportTotal & { category_id: string })[];
  expenses: Expense[];
}

export interface MonthlyReport extends ReportTotal {
  categories: (ReportTotal & { category_id: string })[];
  daily_totals: (ReportTotal & { date: string })[];
}

export interface YearlyReport extends ReportTotal {
  monthly_totals: (ReportTotal & { month: string })[];
  top_categories: (ReportTotal & { category_id: string })[];
}
