import { ParsedSearch } from '../types/analytics';

export interface CalendarMonth {
  year: number;
  month: number;
}

export function getInitialCalendarMonth(search: ParsedSearch): CalendarMonth {
  if (search.type === 'date' && search.date) {
    const d = new Date(search.date + 'T12:00:00');
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }

  if (search.year && search.month) {
    return { year: search.year, month: search.month };
  }

  if (search.type === 'year' && search.year) {
    const now = new Date();
    if (search.year === now.getFullYear()) {
      return { year: now.getFullYear(), month: now.getMonth() + 1 };
    }
    return { year: search.year, month: 12 };
  }

  if (search.type === 'quick' && search.quickFilter === 'last-30-days') {
    const end = new Date(search.to + 'T12:00:00');
    return { year: end.getFullYear(), month: end.getMonth() + 1 };
  }

  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function getCalendarBounds(search: ParsedSearch): { min: CalendarMonth; max: CalendarMonth } {
  const now = new Date();
  const maxYear = now.getFullYear();
  const maxMonth = now.getMonth() + 1;

  if (search.type === 'year' && search.year) {
    return {
      min: { year: search.year, month: 1 },
      max: {
        year: search.year,
        month: search.year === maxYear ? maxMonth : 12,
      },
    };
  }

  return {
    min: { year: maxYear - 10, month: 1 },
    max: { year: maxYear, month: maxMonth },
  };
}

export function addMonths(year: number, month: number, delta: number): CalendarMonth {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function monthValue({ year, month }: CalendarMonth): number {
  return year * 12 + month;
}

export function canGoPrev(current: CalendarMonth, min: CalendarMonth): boolean {
  return monthValue(current) > monthValue(min);
}

export function canGoNext(current: CalendarMonth, max: CalendarMonth): boolean {
  return monthValue(current) < monthValue(max);
}
