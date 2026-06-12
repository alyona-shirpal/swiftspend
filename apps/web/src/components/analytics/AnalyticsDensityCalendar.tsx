import React, { useState, useEffect } from 'react';
import { Currency } from '@swiftspend/types';
import { DensityDay } from '../../types/analytics';
import { CalendarMonth } from '../../utils/calendarBounds';
import { formatCurrency } from '../../utils/formatCurrency';

interface DensityCalendarData {
  year: number;
  month: number;
  days: DensityDay[];
  maxAmount: number;
}

interface AnalyticsDensityCalendarProps {
  calendar: DensityCalendarData | null | undefined;
  viewMonth: CalendarMonth;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  highlightDate?: string;
  currency?: Currency;
  isLoading?: boolean;
}

/** Color by total money spent that day relative to the month's highest-spend day */
function intensityClass(totalSpent: number, maxSpent: number, isSearchedDate: boolean): string {
  if (totalSpent <= 0) return 'bg-surface-container-low/40 text-outline';

  const ratio = maxSpent > 0 ? totalSpent / maxSpent : 0;
  let colorClass: string;

  if (ratio >= 0.75) {
    colorClass = 'bg-[#047857] text-on-primary'; // dark green — highest spend
  } else if (ratio >= 0.5) {
    colorClass = 'bg-[#10B981] text-on-primary'; // medium green
  } else if (ratio >= 0.25) {
    colorClass = 'bg-[#6EE7B7] text-primary'; // light green
  } else {
    colorClass = 'bg-[#D1FAE5] text-primary'; // pale green — low spend but had expenses
  }

  if (isSearchedDate) {
    return `${colorClass} font-bold ring-2 ring-primary ring-offset-1`;
  }

  return colorClass;
}

export const AnalyticsDensityCalendar: React.FC<AnalyticsDensityCalendarProps> = ({
  calendar,
  viewMonth,
  canGoPrev,
  canGoNext,
  onPrevMonth,
  onNextMonth,
  highlightDate,
  currency = Currency.EUR,
  isLoading,
}) => {
  const monthLabel = new Date(viewMonth.year, viewMonth.month - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const [hovered, setHovered] = useState<DensityDay | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => {
      setHovered(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  if (isLoading) {
    return (
      <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
        <div className="flex items-center justify-between mb-6">
          <div className="h-5 w-40 bg-surface-container-highest rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-surface-container-highest rounded-full animate-pulse" />
            <div className="w-8 h-8 bg-surface-container-highest rounded-full animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} className="aspect-square bg-surface-container-highest rounded-sm animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!calendar) return null;

  const firstDay = new Date(calendar.year, calendar.month - 1, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const cells: (DensityDay | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...calendar.days,
  ];

  return (
    <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-headline text-base font-bold">Expense Density</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevMonth}
            disabled={!canGoPrev}
            className="p-1.5 rounded-full text-secondary hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Previous month"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            disabled={!canGoNext}
            className="p-1.5 rounded-full text-secondary hover:bg-surface-container-low transition-colors disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Next month"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>

      <p className="text-xs text-outline mb-4">{monthLabel}</p>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell, i) =>
          cell ? (
            <div
              key={cell.date}
              className="relative animate-fade-in"
              onMouseEnter={() => setHovered(cell)}
              onMouseLeave={() => setHovered(null)}
              onClick={(e) => {
                e.stopPropagation();
                setHovered(hovered?.date === cell.date ? null : cell);
              }}
            >
              <div
                className={`aspect-square rounded-sm flex items-center justify-center text-[10px] cursor-help ${intensityClass(
                  cell.amount,
                  calendar.maxAmount,
                  !!highlightDate && cell.date === highlightDate
                )}`}
              >
                {cell.day}
              </div>
              {hovered?.date === cell.date && cell.amount > 0 && (
                <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 min-w-[160px] bg-slate-900 text-slate-100 rounded-lg shadow-xl p-3 text-xs pointer-events-none transition-all duration-200">
                  <div className="font-bold border-b border-slate-700 pb-1.5 mb-1.5 text-center text-[11px] tracking-wide text-emerald-400">
                    Day {cell.day}: {formatCurrency(cell.amount, currency)}
                  </div>
                  {cell.categories ? (
                    <ul className="space-y-1">
                      {Object.entries(cell.categories).map(([cat, amt]) => (
                        <li key={cat} className="flex justify-between items-center gap-4">
                          <span className="text-slate-300 font-medium">{cat}</span>
                          <span className="text-slate-100 font-semibold">{formatCurrency(amt, currency)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-slate-400 text-center italic py-0.5">Uncategorized</div>
                  )}
                  {/* Subtle arrow pointing down to the day */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-0.5 border-[6px] border-transparent border-t-slate-900" />
                </div>
              )}
            </div>
          ) : (
            <div key={`empty-${i}`} className="aspect-square bg-surface-container-low/20 rounded-sm" />
          )
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs text-outline uppercase font-medium">Activity Level</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-outline">Less</span>
          <div className="w-3 h-3 bg-surface-container-low rounded-sm" />
          <div className="w-3 h-3 bg-[#D1FAE5] rounded-sm" />
          <div className="w-3 h-3 bg-[#6EE7B7] rounded-sm" />
          <div className="w-3 h-3 bg-[#10B981] rounded-sm" />
          <div className="w-3 h-3 bg-[#047857] rounded-sm" />
          <span className="text-[10px] text-outline">More</span>
        </div>
      </div>
    </section>
  );
};
