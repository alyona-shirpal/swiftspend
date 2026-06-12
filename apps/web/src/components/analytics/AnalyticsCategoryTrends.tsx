import React from 'react';
import { CategoryTrend } from '../../types/analytics';

interface AnalyticsCategoryTrendsProps {
  trends: CategoryTrend[];
  isLoading?: boolean;
}

export const AnalyticsCategoryTrends: React.FC<AnalyticsCategoryTrendsProps> = ({
  trends,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
        <div className="h-5 w-48 bg-surface-container-highest rounded animate-pulse mb-6" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-surface-container-highest rounded animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
      <h2 className="font-headline text-base font-bold mb-6">
        Trends <span className="text-outline font-normal">vs Prev Period</span>
      </h2>
      <div className="space-y-6">
        {trends.map((trend) => (
          <div key={trend.id ?? trend.name} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">{trend.icon}</span>
              </div>
              <span className="text-sm font-medium">{trend.name}</span>
            </div>
            <div
              className={`flex items-center gap-2 ${
                trend.direction === 'up'
                  ? 'text-error'
                  : trend.direction === 'down'
                    ? 'text-[#10B981]'
                    : 'text-outline'
              }`}
            >
              {trend.direction === 'up' && (
                <span className="material-symbols-outlined text-sm">arrow_upward</span>
              )}
              {trend.direction === 'down' && (
                <span className="material-symbols-outlined text-sm">arrow_downward</span>
              )}
              {trend.direction === 'same' && (
                <span className="material-symbols-outlined text-sm">horizontal_rule</span>
              )}
              <span className="font-bold">
                {trend.direction === 'same' ? 'No change' : `${trend.direction === 'up' ? '+' : '-'}${trend.changePercent}%`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
