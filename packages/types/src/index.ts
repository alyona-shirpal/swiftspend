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
  merchant: string | null
  normalized_merchant: string | null
  description: string | null
  normalized_description: string | null
  date: string
  created_at: string
  amount: number
  currency: Currency
  amounts: CurrencyAmounts
  exchange_rate_snapshot: RateSnapshot
  provider?: string | null
  external_id?: string | null
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
  merchant?: string
  description?: string
}

// Response shape for report totals — works for any number of currencies
export interface ReportTotals {
  default_currency: Currency
  amounts: CurrencyAmounts
}

export interface Category {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  is_system: boolean
  is_hidden: boolean
  created_at: string
  last_used_at: string | null
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_preview: string;
  last_used_at: string | null;
  created_at: string;
}

export interface CreateApiKeyBody {
  name: string;
}

export interface ApiKeyCreatedResponse {
  id: string;
  name: string;
  key_preview: string;
  created_at: string;
  api_key: string;
}

// Expense, Report types will be added here after DB schema is finalized

export interface MonobankAccount {
  id: string;
  currencyCode: number;
  type: string;
  balance: number;
  creditLimit: number;
  maskedPan?: string[];
  iban?: string;
}

export interface MonobankIntegration {
  id: string;
  display_name: string | null;
  monobank_client_id: string | null;
  monobank_accounts: MonobankAccount[] | null;
  created_at: string;
  last_synced_at: string | null;
}

export interface MonobankPendingImport {
  id: string;
  external_id: string;
  account_id: string;
  time: string;           // ISO string
  description: string | null;
  mcc: number | null;
  amount: number;         // decimal, always positive (debit)
  currency: string;       // alpha code e.g. 'UAH'
  hold: boolean;
  status: 'pending' | 'accepted' | 'declined';
  suggested_category: { id: string; name: string; icon: string } | null;
  created_at: string;
}

