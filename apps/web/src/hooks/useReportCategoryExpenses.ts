import { useQuery } from '@tanstack/react-query';
import { Currency, Expense } from '@swiftspend/types';
import { fetchAllExpenses } from '../services/expenses';

interface ReportCategoryExpensesParams {
  from: string;
  to: string;
  categoryId: string | null;
  currency: Currency;
  enabled: boolean;
}

function getExpenseAmount(expense: Expense, currency: Currency): number {
  return expense.amounts?.[currency] ?? (expense.currency === currency ? expense.amount : 0);
}

export function useReportCategoryExpenses({
  from,
  to,
  categoryId,
  currency,
  enabled,
}: ReportCategoryExpensesParams) {
  return useQuery({
    queryKey: ['reports', 'category-expenses', from, to, categoryId, currency],
    enabled,
    queryFn: async () => {
      const expenses = await fetchAllExpenses({
        from,
        to,
        categoryId: categoryId ?? undefined,
      });

      return expenses
        .filter((expense) => expense.category_id === categoryId)
        .sort((a, b) => getExpenseAmount(b, currency) - getExpenseAmount(a, currency));
    },
    staleTime: 60 * 1000,
  });
}

