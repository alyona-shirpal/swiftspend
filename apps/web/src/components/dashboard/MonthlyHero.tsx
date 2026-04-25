import React from 'react';
import { useMonthlyTotal } from '../../hooks/useMonthlyTotal';
import { formatCurrency } from '../../utils/formatCurrency';
import { Currency } from '@swiftspend/types';

export const MonthlyHero: React.FC = () => {
  const { data, isLoading, isError } = useMonthlyTotal();

  if (isLoading) {
    return (
      <section className="relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="animate-pulse">
            <div className="h-3 w-48 bg-surface-container-high rounded mb-4"></div>
            <div className="h-14 w-64 bg-surface-container-highest rounded mb-4"></div>
            <div className="h-4 w-56 bg-surface-container-high rounded mt-4"></div>
          </div>
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="font-label text-[10px] font-medium tracking-[0.2em] text-secondary uppercase mb-2 block">
              Monthly Statement
            </span>
            <h2 className="font-headline text-[3.5rem] leading-none font-extrabold balance-text text-primary dark:text-white opacity-50">
              —
            </h2>
            <div className="flex items-center gap-2 mt-4 opacity-50">
              <span className="font-label text-sm font-semibold text-secondary">
                Could not load total
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const { totals, comparison, year, month } = data;
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

  // Use the EUR total as the primary display currency per design
  const totalAmount = totals.EUR;
  const isDecrease = comparison.direction === 'down';
  const isIncrease = comparison.direction === 'up';

  return (
    <section className="relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="font-label text-[10px] font-medium tracking-[0.2em] text-secondary uppercase mb-2 block">
            Monthly Statement — {monthName}
          </span>
          <h2 className="font-headline text-[3.5rem] leading-none font-extrabold balance-text text-primary dark:text-white">
            {formatCurrency(totalAmount, Currency.EUR)}
          </h2>
          <div className="flex items-center gap-2 mt-4">
            {comparison.direction !== 'same' && (
              <span 
                className={`material-symbols-outlined ${isIncrease ? 'text-error' : 'text-on-tertiary-container'}`} 
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isDecrease ? 'trending_down' : 'trending_up'}
              </span>
            )}
            <span className={`font-label text-sm font-semibold ${isIncrease ? 'text-error' : 'text-on-tertiary-container'}`}>
              {comparison.direction === 'same' 
                ? 'Same as last month' 
                : `${comparison.change_percent}% ${isDecrease ? 'decrease' : 'increase'} from last month`
              }
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
