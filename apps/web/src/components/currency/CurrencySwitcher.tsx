import React from 'react';
import { Currency } from '@swiftspend/types';
import { useCurrencyStore } from '../../store/currencyStore';
import { cn } from '../../utils/cn';

const currencies = [
  { value: Currency.EUR, label: 'EUR' },
  { value: Currency.USD, label: 'USD' },
  { value: Currency.ALL, label: 'ALL' },
  { value: Currency.UAH, label: 'UAH' },
];

export const CurrencySwitcher: React.FC = () => {
  const { currency, setCurrency } = useCurrencyStore();

  return (
    <div className="flex bg-surface-container-low p-1 rounded-lg w-fit">
      {currencies.map((curr) => (
        <button
          key={curr.value}
          onClick={() => setCurrency(curr.value)}
          className={cn(
            "px-4 py-1.5 text-[10px] font-bold font-headline tracking-widest rounded-md transition-all duration-200",
            currency === curr.value
              ? "bg-white text-primary shadow-sm"
              : "text-secondary hover:bg-white/50"
          )}
        >
          {curr.label}
        </button>
      ))}
    </div>
  );
};
