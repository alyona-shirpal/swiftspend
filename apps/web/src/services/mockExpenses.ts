import { Currency, type CurrencyAmounts } from '@swiftspend/types';
import type { Category, MonthlyTotal, RecentExpense } from '../types/api';

type AddExpensePayload = {
  amount: number;
  currency: Currency;
  category_id?: string;
  description?: string;
  date?: string;
};

type CreateCategoryPayload = {
  name: string;
  icon: string;
  color: string;
};

type StoredExpense = RecentExpense;

const EXPENSES_KEY = 'swiftspend.mock.expenses';
const CATEGORIES_KEY = 'swiftspend.mock.categories';

const FX_TO_EUR: Record<Currency, number> = {
  [Currency.EUR]: 1,
  [Currency.USD]: 0.88,
  [Currency.ALL]: 0.0102,
  [Currency.UAH]: 0.021,
};

export const MOCK_CATEGORIES: Category[] = [
  { id: 'mock-food', name: 'Food', icon: 'restaurant', color: '#FF6B35' },
  { id: 'mock-restaurants', name: 'Restaurants', icon: 'dining', color: '#9B59B6' },
  { id: 'mock-home', name: 'Home', icon: 'home', color: '#2196F3' },
  { id: 'mock-travel', name: 'Travel', icon: 'flight', color: '#0EA5A4' },
  { id: 'mock-health', name: 'Health', icon: 'medical_services', color: '#16A34A' },
  { id: 'mock-beauty', name: 'Beauty', icon: 'content_cut', color: '#E91E63' },
  { id: 'mock-clothing', name: 'Clothing', icon: 'checkroom', color: '#F59E0B' },
  { id: 'mock-childcare', name: 'Childcare', icon: 'child_care', color: '#8B5CF6' },
];

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function buildAmounts(amount: number, currency: Currency): CurrencyAmounts {
  const eurValue = amount * FX_TO_EUR[currency];

  return {
    [Currency.EUR]: Number(eurValue.toFixed(2)),
    [Currency.USD]: Number((eurValue / FX_TO_EUR[Currency.USD]).toFixed(2)),
    [Currency.ALL]: Number((eurValue / FX_TO_EUR[Currency.ALL]).toFixed(2)),
    [Currency.UAH]: Number((eurValue / FX_TO_EUR[Currency.UAH]).toFixed(2)),
  };
}

export function getMockCategories(): Category[] {
  const customCategories = readJson<Category[]>(CATEGORIES_KEY, []);
  return [...MOCK_CATEGORIES, ...customCategories];
}

export function getMockExpenses(): StoredExpense[] {
  const expenses = readJson<StoredExpense[]>(EXPENSES_KEY, []);
  return expenses.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

export async function createMockCategory(payload: CreateCategoryPayload): Promise<Category> {
  const nextCategory: Category = {
    id: `custom-${crypto.randomUUID()}`,
    name: payload.name,
    icon: payload.icon,
    color: payload.color,
  };

  const categories = readJson<Category[]>(CATEGORIES_KEY, []);
  writeJson(CATEGORIES_KEY, [nextCategory, ...categories]);
  return nextCategory;
}

export async function addMockExpense(payload: AddExpensePayload): Promise<RecentExpense> {
  const categories = getMockCategories();
  const category = categories.find((item) => item.id === payload.category_id) ?? null;
  const now = new Date();
  const [year, month, day] = (payload.date ?? now.toISOString().split('T')[0] ?? '').split('-');
  const createdAt = year && month && day
    ? new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
      ).toISOString()
    : now.toISOString();

  const expense: RecentExpense = {
    id: `expense-${crypto.randomUUID()}`,
    description: payload.description ?? null,
    date: createdAt.split('T')[0] ?? createdAt,
    time: createdAt,
    amount: payload.amount,
    currency: payload.currency,
    amounts: buildAmounts(payload.amount, payload.currency),
    category,
  };

  const expenses = getMockExpenses();
  writeJson(EXPENSES_KEY, [expense, ...expenses]);
  return expense;
}

export function getMockRecentCategories(): Category[] {
  const seen = new Set<string>();
  const recentCategories: Category[] = [];

  for (const expense of getMockExpenses()) {
    if (!expense.category || seen.has(expense.category.id)) continue;
    seen.add(expense.category.id);
    recentCategories.push(expense.category);
    if (recentCategories.length >= 8) break;
  }

  return recentCategories;
}

export function getMockMonthlyTotal(year?: number, month?: number): MonthlyTotal {
  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth() + 1;
  const previousDate = new Date(targetYear, targetMonth - 2, 1);
  const expenses = getMockExpenses();

  const sumForMonth = (candidateYear: number, candidateMonth: number) =>
    expenses
      .filter((expense) => {
        const date = new Date(expense.time);
        return date.getFullYear() === candidateYear && date.getMonth() + 1 === candidateMonth;
      })
      .reduce((sum, expense) => sum + Number(expense.amounts[Currency.EUR] ?? 0), 0);

  const currentTotal = Number(sumForMonth(targetYear, targetMonth).toFixed(2));
  const previousTotal = Number(
    sumForMonth(previousDate.getFullYear(), previousDate.getMonth() + 1).toFixed(2)
  );

  const direction =
    currentTotal === previousTotal ? 'same' : currentTotal > previousTotal ? 'up' : 'down';
  const changePercent =
    previousTotal === 0
      ? currentTotal === 0 ? 0 : 100
      : Math.abs(Number((((currentTotal - previousTotal) / previousTotal) * 100).toFixed(1)));

  return {
    year: targetYear,
    month: targetMonth,
    default_currency: Currency.EUR,
    totals: {
      [Currency.UAH]: 0,
      [Currency.ALL]: 0,
      [Currency.EUR]: currentTotal,
      [Currency.USD]: 0,
    },
    comparison: {
      previous_month_eur: previousTotal,
      change_percent: changePercent,
      direction,
    },
  };
}
