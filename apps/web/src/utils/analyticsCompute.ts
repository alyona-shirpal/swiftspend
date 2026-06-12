import { Currency, Expense } from '@swiftspend/types';
import { Category } from '../types/api';
import { getExpenseAmountInCurrency } from './expenseAmount';
import {
  AnalyticsData,
  CategoryTrend,
  DensityDay,
  MerchantItem,
  ParsedSearch,
} from '../types/analytics';
import { ReportCategory } from '../types/reports';

function daysBetween(from: string, to: string): number {
  const start = new Date(from + 'T12:00:00');
  const end = new Date(to + 'T12:00:00');
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
}

export function computeNoSpendStreak(expenses: Expense[], endDate: string): number {
  const datesWithSpend = new Set(expenses.map((e) => e.date));
  let streak = 0;
  const d = new Date(endDate + 'T12:00:00');

  for (let i = 0; i < 366; i++) {
    const ds = d.toISOString().split('T')[0]!;
    if (datesWithSpend.has(ds)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return streak;
}

export function computeCategories(
  expenses: Expense[],
  currency: Currency,
  categoryMap: Map<string, Category>
): ReportCategory[] {
  const map = new Map<string, ReportCategory>();
  let total = 0;

  for (const e of expenses) {
    const amt = getExpenseAmountInCurrency(e, currency);
    total += amt;
    const catId = e.category_id ?? 'uncategorized';
    const cat = e.category_id ? categoryMap.get(e.category_id) : null;

    if (!map.has(catId)) {
      map.set(catId, {
        id: cat?.id ?? null,
        name: cat?.name ?? 'Uncategorized',
        icon: cat?.icon ?? 'help',
        color: cat?.color ?? '#999999',
        total: 0,
        count: 0,
        percentage: 0,
      });
    }
    const entry = map.get(catId)!;
    entry.total += amt;
    entry.count += 1;
  }

  return Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .map((cat) => ({
      ...cat,
      percentage: total > 0 ? Math.round((cat.total / total) * 100) : 0,
    }));
}

export function computeMerchants(
  expenses: Expense[],
  currency: Currency,
  categoryMap: Map<string, Category>
): MerchantItem[] {
  const map = new Map<string, MerchantItem & { total: number }>();

  for (const e of expenses) {
    const name = e.description?.trim() || 'Unnamed expense';
    const key = name.toLowerCase();
    const cat = e.category_id ? categoryMap.get(e.category_id) : null;
    const amt = getExpenseAmountInCurrency(e, currency);

    if (!map.has(key)) {
      map.set(key, {
        name,
        categoryName: cat?.name ?? 'Uncategorized',
        categoryIcon: cat?.icon ?? 'receipt',
        total: 0,
      });
    }
    map.get(key)!.total += amt;
  }

  return Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

export function computeCategoryTrends(
  current: Expense[],
  previous: Expense[],
  currency: Currency,
  categoryMap: Map<string, Category>
): CategoryTrend[] {
  const sumByCategory = (list: Expense[]) => {
    const m = new Map<string, number>();
    for (const e of list) {
      const id = e.category_id ?? 'uncategorized';
      m.set(id, (m.get(id) ?? 0) + getExpenseAmountInCurrency(e, currency));
    }
    return m;
  };

  const cur = sumByCategory(current);
  const prev = sumByCategory(previous);
  const allIds = new Set([...cur.keys(), ...prev.keys()]);

  const trends: CategoryTrend[] = [];
  for (const id of allIds) {
    const curTotal = cur.get(id) ?? 0;
    const prevTotal = prev.get(id) ?? 0;
    const cat = id !== 'uncategorized' ? categoryMap.get(id) : null;

    let changePercent = 0;
    let direction: 'up' | 'down' | 'same' = 'same';
    if (prevTotal === 0 && curTotal > 0) {
      changePercent = 100;
      direction = 'up';
    } else if (prevTotal > 0) {
      changePercent = Math.abs(((curTotal - prevTotal) / prevTotal) * 100);
      if (curTotal > prevTotal * 1.01) direction = 'up';
      else if (curTotal < prevTotal * 0.99) direction = 'down';
    }

    if (curTotal === 0 && prevTotal === 0) continue;

    trends.push({
      id: cat?.id ?? null,
      name: cat?.name ?? 'Uncategorized',
      icon: cat?.icon ?? 'help',
      changePercent: Math.round(changePercent),
      direction,
    });
  }

  return trends
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5);
}

export function buildMonthDensity(
  expenses: Expense[],
  currency: Currency,
  year: number,
  month: number,
  highlightDate?: string,
  categories: Category[] = []
): { year: number; month: number; days: DensityDay[]; maxAmount: number } {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  // Map each date to total amount and per‑category breakdown
  const dayData = new Map<string, { amount: number; categories: Record<string, number> }>();
  for (const e of expenses) {
    const value = getExpenseAmountInCurrency(e, currency);
    if (value <= 0) continue;
    const date = e.date;
    const cat = e.category_id ? categoryMap.get(e.category_id) : null;
    const catName = cat?.name ?? 'Uncategorized';
    const entry = dayData.get(date) ?? { amount: 0, categories: {} };
    entry.amount += value;
    entry.categories[catName] = (entry.categories[catName] ?? 0) + value;
    dayData.set(date, entry);
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const days: DensityDay[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const info = dayData.get(date) ?? { amount: 0, categories: {} };
    days.push({
      day,
      date,
      amount: info.amount,
      isInPeriod: highlightDate ? date === highlightDate : false,
      categories: Object.keys(info.categories).length ? info.categories : undefined,
    });
  }

  const spendingDays = days.filter((d) => d.amount > 0);
  const maxAmount = spendingDays.length > 0
    ? Math.max(...spendingDays.map((d) => d.amount))
    : 1;

  return { year, month, days, maxAmount };
}

export function buildAnalyticsData(
  search: ParsedSearch,
  expenses: Expense[],
  previousExpenses: Expense[],
  currency: Currency,
  categories: Category[]
): AnalyticsData {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const total = expenses.reduce((sum, e) => sum + getExpenseAmountInCurrency(e, currency), 0);
  const periodDays = daysBetween(search.from, search.to);
  const dailyAverage = search.type === 'date' ? total : total / periodDays;

  const endDate = search.type === 'date' && search.date ? search.date : search.to;

  const showCategoryBreakdown = search.type !== 'category';
  const showTrends =
    search.type === 'month' ||
    search.type === 'year' ||
    (search.type === 'quick' && (search.quickFilter === 'this-month' || search.quickFilter === 'this-year'));

  return {
    label: search.label,
    searchType: search.type,
    hasData: total > 0,
    total,
    dailyAverage,
    noSpendStreak: computeNoSpendStreak(expenses, endDate),
    categories: computeCategories(expenses, currency, categoryMap),
    trends: showTrends
      ? computeCategoryTrends(expenses, previousExpenses, currency, categoryMap)
      : null,
    merchants: computeTopMerchants(expenses, currency, categoryMap),
    showCategoryBreakdown,
    showTrends,
  };
}

function computeTopMerchants(
  expenses: Expense[],
  currency: Currency,
  categoryMap: Map<string, Category>
): MerchantItem[] {
  return computeMerchants(expenses, currency, categoryMap);
}

export function getPreviousPeriodRange(search: ParsedSearch): { from: string; to: string } | null {
  if (search.type === 'month' || (search.type === 'quick' && search.quickFilter === 'this-month')) {
    const y = search.year ?? new Date().getFullYear();
    const m = search.month ?? new Date().getMonth() + 1;
    const prevM = m === 1 ? 12 : m - 1;
    const prevY = m === 1 ? y - 1 : y;
    const from = `${prevY}-${String(prevM).padStart(2, '0')}-01`;
    const lastDay = new Date(prevY, prevM, 0).getDate();
    const to = `${prevY}-${String(prevM).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { from, to };
  }

  if (search.type === 'year' || (search.type === 'quick' && search.quickFilter === 'this-year')) {
    const y = (search.year ?? new Date().getFullYear()) - 1;
    return { from: `${y}-01-01`, to: `${y}-12-31` };
  }

  return null;
}
