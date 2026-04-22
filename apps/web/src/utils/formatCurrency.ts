import { Currency } from '@swiftspend/types';

/**
 * Formats a numeric amount into a currency string based on the provided currency.
 * Applies correct symbols and locale formatting.
 * 
 * Symbols:
 * - UAH: ₴
 * - ALL: L
 * - EUR: €
 * - USD: $
 */
export const formatCurrency = (amount: number, currency: Currency): string => {
  const symbols: Record<Currency, { symbol: string; locale: string }> = {
    [Currency.UAH]: { symbol: '₴', locale: 'uk-UA' },
    [Currency.ALL]: { symbol: 'L', locale: 'sq-AL' },
    [Currency.EUR]: { symbol: '€', locale: 'de-DE' },
    [Currency.USD]: { symbol: '$', locale: 'en-US' },
  };

  const { symbol, locale } = symbols[currency] || symbols[Currency.EUR];

  // NOTE: We use a custom format here because some locales might place the symbol differently.
  // We want a consistent "Symbol + Amount" or "Amount + Symbol" based on common app patterns.
  const formatter = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedAmount = formatter.format(amount);

  switch (currency) {
    case Currency.UAH:
      return `₴${formattedAmount}`;
    case Currency.ALL:
      return `${formattedAmount} L`;
    case Currency.EUR:
      return `€${formattedAmount}`;
    case Currency.USD:
      return `$${formattedAmount}`;
    default:
      return `€${formattedAmount}`;
  }
};
