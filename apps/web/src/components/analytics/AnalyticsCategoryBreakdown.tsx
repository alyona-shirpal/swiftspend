import React from 'react';
import { Currency } from '@swiftspend/types';
import { ReportCategory } from '../../types/reports';
import { formatCurrency } from '../../utils/formatCurrency';

interface AnalyticsCategoryBreakdownProps {
  categories: ReportCategory[];
  total: number;
  currency: Currency;
  isLoading?: boolean;
}

const CHART_COLORS = ['#000000', '#47607e', '#e0e3e5', '#c4c6cc', '#74777d', '#79849d'];

export const AnalyticsCategoryBreakdown: React.FC<AnalyticsCategoryBreakdownProps> = ({
  categories,
  total,
  currency,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
        <div className="h-5 w-44 bg-surface-container-highest rounded animate-pulse mb-8" />
        <div className="w-[200px] h-[200px] mx-auto rounded-full bg-surface-container-highest animate-pulse mb-10" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-5 bg-surface-container-highest rounded animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  const top = categories.slice(0, 5);
  let offset = 0;
  const segments = top.map((cat, i) => {
    const pct = total > 0 ? (cat.total / total) * 100 : 0;
    const dash = `${pct} ${100 - pct}`;
    const seg = { dash, offset, color: CHART_COLORS[i % CHART_COLORS.length]! };
    offset -= pct;
    return seg;
  });

  return (
    <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
      <h2 className="font-headline text-base font-bold mb-8">Category Allocation</h2>
      <div className="flex justify-center mb-10">
        <div className="relative w-[200px] h-[200px] flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" fill="transparent" r="16" stroke="#f2f4f6" strokeWidth="3" />
            {segments.map((seg, i) => (
              <circle
                key={i}
                cx="18"
                cy="18"
                fill="transparent"
                r="16"
                stroke={seg.color}
                strokeDasharray={seg.dash}
                strokeDashoffset={seg.offset}
                strokeLinecap="round"
                strokeWidth="3"
              />
            ))}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-xs text-outline uppercase font-bold tracking-widest">Total</span>
            <span className="font-headline text-base font-black">{formatCurrency(total, currency)}</span>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {top.map((cat, i) => (
          <div key={cat.id ?? cat.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="text-sm font-medium">{cat.name}</span>
            </div>
            <span className="text-sm font-bold">{cat.percentage}%</span>
          </div>
        ))}
      </div>
    </section>
  );
};
