import React from 'react';
import { Currency } from '@swiftspend/types';
import { formatCurrency } from '../../utils/formatCurrency';

interface AnalyticsQuickStatsProps {
  label: string;
  dailyAverage: number;
  noSpendStreak: number;
  total: number;
  currency: Currency;
  isLoading?: boolean;
}

export const AnalyticsQuickStats: React.FC<AnalyticsQuickStatsProps> = ({
  label,
  dailyAverage,
  noSpendStreak,
  total,
  currency,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <>
        <div className="px-0 mb-2">
          <div className="h-4 w-40 bg-surface-container-highest rounded animate-pulse" />
        </div>
        <section className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10">
              <div className="h-3 w-12 bg-surface-container-highest rounded animate-pulse mb-2" />
              <div className="h-6 w-16 bg-surface-container-highest rounded animate-pulse" />
            </div>
          ))}
        </section>
      </>
    );
  }

  return (
    <>
      <div className="mb-2">
        <p className="text-xs text-outline font-medium uppercase tracking-widest">
          Results for <span className="text-primary font-bold">{label}</span>
        </p>
      </div>
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10">
          <p className="text-xs text-secondary font-medium mb-1">Daily Avg</p>
          <p className="font-headline text-base font-bold">{formatCurrency(dailyAverage, currency)}</p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10">
          <p className="text-xs text-secondary font-medium mb-1">Streak</p>
          <div className="flex items-baseline gap-1">
            <p className="font-headline text-base font-bold">{noSpendStreak}d</p>
            {noSpendStreak > 0 && (
              <span
                className="material-symbols-outlined text-[#10B981] text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            )}
          </div>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10">
          <p className="text-xs text-secondary font-medium mb-1">Total</p>
          <p className="font-headline text-base font-bold">{formatCurrency(total, currency)}</p>
        </div>
      </section>
    </>
  );
};
