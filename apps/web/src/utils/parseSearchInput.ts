import { Category } from '../types/api';
import { ParsedSearch, QuickFilter } from '../types/analytics';

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

const MONTH_SHORT = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function monthRange(year: number, month: number): { from: string; to: string; label: string } {
  const from = formatDate(year, month, 1);
  const to = formatDate(year, month, lastDayOfMonth(year, month));
  const label = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  return { from, to, label };
}

function yearRange(year: number): { from: string; to: string; label: string } {
  return { from: formatDate(year, 1, 1), to: formatDate(year, 12, 31), label: String(year) };
}

function parseMonthName(text: string): number | null {
  const lower = text.toLowerCase();
  let idx = MONTH_NAMES.findIndex((m) => lower === m || lower.startsWith(m.slice(0, 3)));
  if (idx === -1) {
    idx = MONTH_SHORT.findIndex((m) => lower === m);
  }
  return idx === -1 ? null : idx + 1;
}

function fuzzyMatchCategory(query: string, categories: Category[]): Category | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const exact = categories.find((c) => c.name.toLowerCase() === q);
  if (exact) return exact;

  const partial = categories.filter(
    (c) => c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase())
  );
  if (partial.length === 1) return partial[0]!;

  if (partial.length > 1) {
    return partial.sort((a, b) => {
      const aExact = a.name.toLowerCase() === q ? 0 : 1;
      const bExact = b.name.toLowerCase() === q ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return a.name.length - b.name.length;
    })[0]!;
  }

  const words = q.split(/\s+/);
  const wordMatches = categories.filter((c) => {
    const name = c.name.toLowerCase();
    return words.every((w) => name.includes(w));
  });
  if (wordMatches.length >= 1) {
    return wordMatches.sort((a, b) => a.name.length - b.name.length)[0]!;
  }

  return null;
}

export function getQuickFilterSearch(filter: QuickFilter): ParsedSearch {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (filter === 'this-month') {
    const range = monthRange(year, month);
    return {
      type: 'quick',
      label: 'This Month',
      from: range.from,
      to: range.to,
      year,
      month,
      quickFilter: filter,
    };
  }

  if (filter === 'this-year') {
    const range = yearRange(year);
    return {
      type: 'quick',
      label: 'This Year',
      from: range.from,
      to: range.to,
      year,
      quickFilter: filter,
    };
  }

  const end = formatDate(year, month, now.getDate());
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 29);
  const from = formatDate(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate());

  return {
    type: 'quick',
    label: 'Last 30 Days',
    from,
    to: end,
    quickFilter: filter,
  };
}

export function parseSearchInput(query: string, categories: Category[]): ParsedSearch | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();

  if (lower === 'this month') return getQuickFilterSearch('this-month');
  if (lower === 'this year') return getQuickFilterSearch('this-year');
  if (lower === 'last 30 days') return getQuickFilterSearch('last-30-days');

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return null;
    const label = d.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' });
    return { type: 'date', label, from: trimmed, to: trimmed, date: trimmed };
  }

  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    const [y, m] = trimmed.split('-').map(Number);
    if (!y || !m || m < 1 || m > 12) return null;
    const range = monthRange(y, m);
    return { type: 'month', label: range.label, from: range.from, to: range.to, year: y, month: m };
  }

  if (/^\d{4}$/.test(trimmed)) {
    const y = parseInt(trimmed, 10);
    const range = yearRange(y);
    return { type: 'year', label: range.label, from: range.from, to: range.to, year: y };
  }

  const monthYearMatch = trimmed.match(/^([a-zA-Z]+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const m = parseMonthName(monthYearMatch[1]!);
    const y = parseInt(monthYearMatch[2]!, 10);
    if (m) {
      const range = monthRange(y, m);
      return { type: 'month', label: range.label, from: range.from, to: range.to, year: y, month: m };
    }
  }

  const monthDayYearMatch = trimmed.match(/^([a-zA-Z]+)\s+(\d{1,2})(?:\s+(\d{4}))?$/);
  if (monthDayYearMatch) {
    const m = parseMonthName(monthDayYearMatch[1]!);
    const day = parseInt(monthDayYearMatch[2]!, 10);
    const y = monthDayYearMatch[3] ? parseInt(monthDayYearMatch[3], 10) : new Date().getFullYear();
    if (m && day >= 1 && day <= lastDayOfMonth(y, m)) {
      const date = formatDate(y, m, day);
      const d = new Date(date + 'T12:00:00');
      const label = d.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' });
      return { type: 'date', label, from: date, to: date, date, year: y, month: m };
    }
  }

  const category = fuzzyMatchCategory(trimmed, categories);
  if (category) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const range = monthRange(y, m);
    return {
      type: 'category',
      label: category.name,
      from: range.from,
      to: range.to,
      year: y,
      month: m,
      category,
    };
  }

  return null;
}
