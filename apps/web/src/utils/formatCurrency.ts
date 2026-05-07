import { Currency } from '@swiftspend/types';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.UAH]: '₴',
  [Currency.ALL]: 'L',
  [Currency.EUR]: '€',
  [Currency.USD]: '$'
};

const CURRENCY_ICONS: Record<Currency, string> = {
  [Currency.UAH]: 'hryvnia',
  [Currency.ALL]: 'currency_lira',
  [Currency.EUR]: 'euro',
  [Currency.USD]: 'attach_money'
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

/**
 * Gets the Material Icon name for a currency.
 * Example: getCurrencyIcon(Currency.EUR) -> "euro"
 */
export function getCurrencyIcon(currency: Currency): string {
  return CURRENCY_ICONS[currency] || 'currency_exchange';
}

/**
 * Gets the currency symbol for display.
 * Example: getCurrencySymbol(Currency.EUR) -> "€"
 */
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}
