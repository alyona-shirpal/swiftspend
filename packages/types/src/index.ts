export enum Currency {
  UAH = 'UAH',
  ALL = 'ALL',
  EUR = 'EUR',
  USD = 'USD',
}

export const DEFAULT_CURRENCY = Currency.EUR

// All supported currencies as an array — used for validation and iteration
export const SUPPORTED_CURRENCIES = Object.values(Currency)

// The amounts object stored in the jsonb column
// key is currency code, value is the converted amount
export type CurrencyAmounts = Partial<Record<Currency, number>>

// The full rates snapshot stored with each expense
export interface RateSnapshot {
  base: Currency
  rates: Record<string, number> // ALL currencies from API
  fetched_at: string
}

export interface UserCurrency {
  id: string
  user_id: string
  currency: Currency
  is_default: boolean
  position: number
  added_at: string
}

export interface Expense {
  id: string
  user_id: string
  category_id: string | null
  description: string | null
  date: string
  created_at: string
  amount: number
  currency: Currency
  amounts: CurrencyAmounts
  exchange_rate_snapshot: RateSnapshot
}

export interface ExpenseWithCategory extends Expense {
  category: {
    id: string
    name: string
    icon: string
    color: string
  } | null
}

// Request body for creating an expense
export interface CreateExpenseBody {
  amount: number
  currency: Currency
  category_id?: string
  description?: string
}

// Response shape for report totals — works for any number of currencies
export interface ReportTotals {
  default_currency: Currency
  amounts: CurrencyAmounts
}

// Expense, Category, Report types will be added here after DB schema is finalized
