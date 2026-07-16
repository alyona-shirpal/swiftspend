import React from 'react';
import { RecentExpense } from '../../types/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { Currency } from '@swiftspend/types';

interface ExpenseRowProps {
  expense: RecentExpense;
  currency: Currency;
  onRequestView?: (expense: RecentExpense) => void;
  onRequestEdit?: (expense: RecentExpense) => void;
  onRequestDelete?: (expense: RecentExpense) => void;
  isDeleting?: boolean;
}

export const ExpenseRow: React.FC<ExpenseRowProps> = ({
  expense,
  currency,
  onRequestView,
  onRequestEdit,
  onRequestDelete,
  isDeleting = false,
}) => {
  // Format the subtitle time/date
  const formatTime = (dateString: string, timeString: string) => {
    const expenseDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = expenseDate.toDateString() === today.toDateString();
    const isYesterday = expenseDate.toDateString() === yesterday.toDateString();

    if (isToday) {
      return new Date(timeString).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (isYesterday) {
      return 'Yesterday';
    } else {
      return expenseDate.toLocaleDateString('default', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const subtitleTime = formatTime(expense.date, expense.time);
  const categoryName = expense.category?.name || 'Uncategorized';
  const icon = expense.category?.icon || 'receipt';

  const title = expense.merchant || expense.description || categoryName;
  const subtitle = [
    expense.merchant ? expense.description : null,
    categoryName,
    subtitleTime,
  ]
    .filter(Boolean)
    .join(' • ');

  // Show the amount in the selected dashboard currency
  const displayAmount =
    expense.amounts?.[currency] ?? expense.amounts?.[Currency.EUR] ?? 0;
  const formattedAmount = `-${formatCurrency(displayAmount, currency)}`;

  // If the expense was recorded in a different currency, show the original
  const hasOriginalCurrency = expense.currency !== currency;
  const formattedOriginal = hasOriginalCurrency
    ? `paid in ${formatCurrency(expense.amount, expense.currency as Currency)}`
    : null;

  const expenseSummary = (
    <>
      <div className="flex min-w-0 items-center gap-3 sm:gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-low transition-colors group-hover:bg-surface-container-highest">
          <span className="material-symbols-outlined text-primary">{icon}</span>
        </div>
        <div className="min-w-0">
          <h4 className="truncate font-body text-md font-semibold text-primary">
            {title}
          </h4>
          <p className="truncate font-label text-xs text-secondary opacity-70">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end text-right">
        <span className="font-body font-bold text-primary transition-all duration-300">
          {formattedAmount}
        </span>
        {formattedOriginal && (
          <span className="mt-0.5 font-label text-[10px] text-secondary opacity-60">
            {formattedOriginal}
          </span>
        )}
      </div>
    </>
  );

  return (
    <div className="group flex items-center gap-1">
      {onRequestView ? (
        <button
          type="button"
          onClick={() => onRequestView(expense)}
          className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label={`View ${title}`}
        >
          {expenseSummary}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          {expenseSummary}
        </div>
      )}

      {(onRequestEdit || onRequestDelete) && (
        <div className="flex shrink-0 items-center gap-1">
        {onRequestEdit && (
          <button
            type="button"
            onClick={() => onRequestEdit(expense)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-outline transition-colors hover:bg-primary/10 hover:text-primary sm:h-9 sm:w-9"
            aria-label={`Edit ${title}`}
            title="Edit expense"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
        )}
        {onRequestDelete && (
          <button
            type="button"
            onClick={() => onRequestDelete(expense)}
            disabled={isDeleting}
            className="flex h-8 w-8 items-center justify-center rounded-full text-outline transition-colors hover:bg-error/10 hover:text-error disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9"
            aria-label={`Delete ${title}`}
            title="Delete expense"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isDeleting ? 'hourglass_empty' : 'delete'}
            </span>
          </button>
        )}
        </div>
      )}
    </div>
  );
};
