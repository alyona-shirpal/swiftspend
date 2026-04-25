import { Currency } from '@swiftspend/types';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.UAH]: '₴',
  [Currency.ALL]: 'L',
  [Currency.EUR]: '€',
  [Currency.USD]: '$'
};

/**
 * Formats an amount with the appropriate currency symbol and 2 decimal places.
 * Example: formatCurrency(18.4, Currency.EUR) -> "€18.40"
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const formattedAmount = amount.toFixed(2);
  
  return `${symbol}${formattedAmount}`;
}
