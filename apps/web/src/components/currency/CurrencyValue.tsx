import React from 'react';
import { Currency } from '@swiftspend/types';
import { useCurrencyStore } from '../../store/currencyStore';
import { formatCurrency } from '../../utils/formatCurrency';
import { cn } from '../../utils/cn';

interface CurrencyValueProps {
  amount: number; // The amount in the currency specified below
  currency?: Currency; // The currency the 'amount' is in. If not provided, uses global active currency.
  asOriginal?: boolean; // If true, shows the amount in its original currency alongside the converted equivalent
  amounts?: Record<Currency, number>; // If provided, allows instant lookup of converted values
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const CurrencyValue: React.FC<CurrencyValueProps> = ({ 
  amount, 
  currency: originalCurrency, 
  asOriginal, 
  amounts,
  className,
  size = 'md'
}) => {
  const { currency: activeCurrency } = useCurrencyStore();

  const displayAmount = amounts ? amounts[activeCurrency] : amount;
  const formatted = formatCurrency(displayAmount, activeCurrency);

  const sizes = {
    sm: 'text-xs',
    md: 'text-sm font-semibold',
    lg: 'text-lg font-bold',
    xl: 'text-[3.5rem] font-headline font-extrabold balance-text leading-none tracking-tight',
  };

  return (
    <div className={cn("inline-flex items-baseline gap-2", className)}>
      <span className={sizes[size]}>{formatted}</span>
      {asOriginal && originalCurrency && originalCurrency !== activeCurrency && (
        <span className="text-[10px] text-secondary opacity-60 font-medium">
          ({formatCurrency(amount, originalCurrency)})
        </span>
      )}
    </div>
  );
};
