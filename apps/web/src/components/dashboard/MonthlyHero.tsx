import React from 'react';
import { useMonthlyTotal } from '../../hooks/useMonthlyTotal';
import { useUserCurrencies } from '../../hooks/useUserCurrencies';
import { formatCurrency, getCurrencyIcon, getCurrencySymbol } from '../../utils/formatCurrency';
import { Currency } from '@swiftspend/types';

interface MonthlyHeroProps {
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

export const MonthlyHero: React.FC<MonthlyHeroProps> = ({ selectedCurrency, onCurrencyChange }) => {
  const { data, isLoading, isError } = useMonthlyTotal();
  const { data: userCurrencies } = useUserCurrencies();

  const currencyOptions =
    userCurrencies?.currencies?.map((uc) => uc.currency as Currency) ?? [Currency.EUR];

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
            <h2 className="font-headline text-[3.5rem] leading-none font-extrabold balance-text text-primary opacity-50">
              {formatCurrency(0, Currency.EUR)}
            </h2>
            <div className="flex items-center gap-2 mt-4 opacity-50">
              <span className="font-label text-sm font-semibold text-secondary">
                No expenses yet for this month
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const { totals, comparison, year, month } = data;
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

  const totalAmount = totals[selectedCurrency] ?? totals[Currency.EUR] ?? 0;
  const isDecrease = comparison.direction === 'down';
  const isIncrease = comparison.direction === 'up';

  return (
    <section className="relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <span className="font-label text-[10px] font-medium tracking-[0.2em] text-secondary uppercase mb-2 block">
            Monthly Statement — {monthName}
          </span>

          {/* Currency switcher — same style as reports */}
          <div className="flex rounded-lg bg-surface-container-low p-1 mb-4 w-fit">
            {currencyOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onCurrencyChange(option)}
                className={`rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedCurrency === option
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-secondary hover:bg-white/50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex items-baseline gap-3">
            <span
              className={`text-[2rem] text-primary ${
                selectedCurrency === Currency.UAH ? '' : 'material-symbols-outlined'
              }`}
            >
              {selectedCurrency === Currency.UAH
                ? getCurrencySymbol(selectedCurrency)
                : getCurrencyIcon(selectedCurrency)}
            </span>
            <h2 className="font-headline text-[3.5rem] leading-none font-extrabold balance-text text-primary transition-all duration-300">
              {formatCurrency(totalAmount, selectedCurrency).replace(
                getCurrencySymbol(selectedCurrency),
                ''
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2 mt-4">
            {comparison.direction !== 'same' && (
              <span
                className={`material-symbols-outlined ${
                  isIncrease ? 'text-error' : 'text-on-tertiary-container'
                }`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isDecrease ? 'trending_down' : 'trending_up'}
              </span>
            )}
            <span
              className={`font-label text-sm font-semibold ${
                isIncrease ? 'text-error' : 'text-on-tertiary-container'
              }`}
            >
              {comparison.direction === 'same'
                ? 'Same as last month'
                : `${comparison.change_percent}% ${
                    isDecrease ? 'decrease' : 'increase'
                  } from last month`}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
