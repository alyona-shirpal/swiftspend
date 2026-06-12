import { Currency, Expense } from '@swiftspend/types';

/**
 * Returns the monetary value of an expense in the requested currency.
 * Sums all transactions on a day via buildMonthDensity — never counts transaction qty.
 */
export function getExpenseAmountInCurrency(expense: Expense, currency: Currency): number {
  const amounts = expense.amounts;
  if (amounts && typeof amounts === 'object') {
    const converted = Number((amounts as Record<string, number>)[currency]);
    if (!Number.isNaN(converted) && converted > 0) {
      return converted;
    }
  }

  if (expense.currency === currency) {
    return Number(expense.amount) || 0;
  }

  return 0;
}
