import React from 'react';
import { RecentExpense } from '../../types/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { Currency } from '@swiftspend/types';

interface ExpenseRowProps {
  expense: RecentExpense;
  currency: Currency;
  onClick?: (expense: RecentExpense) => void;
  onRequestDelete?: (expense: RecentExpense) => void;
  isDeleting?: boolean;
}

export const ExpenseRow: React.FC<ExpenseRowProps> = ({
  expense,
  currency,
  onClick,
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
      return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Yesterday';
    } else {
      return expenseDate.toLocaleDateString('default', { month: 'short', day: 'numeric' });
    }
  };

  const subtitleTime = formatTime(expense.date, expense.time);
  const categoryName = expense.category?.name || 'Uncategorized';
  const icon = expense.category?.icon || 'receipt';

  // Description falls back to category name
  const title = expense.description || categoryName;

  // Show the amount in the selected dashboard currency
  const displayAmount = expense.amounts?.[currency] ?? expense.amounts?.[Currency.EUR] ?? 0;
  const formattedAmount = `-${formatCurrency(displayAmount, currency)}`;

  // If the expense was recorded in a different currency, show the original
  const hasOriginalCurrency = expense.currency !== currency;
  const formattedOriginal = hasOriginalCurrency
    ? `paid in ${formatCurrency(expense.amount, expense.currency as Currency)}`
    : null;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={() => onClick?.(expense)}
      onKeyDown={(event) => {
        if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        onClick(expense);
      }}
      className={`flex items-center justify-between gap-3 group ${
        onClick ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl' : ''
      }`}
    >
      <div className="flex min-w-0 items-center gap-5">
        <div className="w-12 h-12 flex items-center justify-center bg-surface-container-low rounded-lg group-hover:bg-surface-container-highest transition-colors">
          <span className="material-symbols-outlined text-primary">{icon}</span>
        </div>
        <div className="min-w-0">
          <h4 className="font-body text-md font-semibold text-primary truncate">{title}</h4>
          <p className="font-label text-xs text-secondary opacity-70">
            {categoryName} • {subtitleTime}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="text-right flex flex-col items-end">
          <span className="font-body font-bold text-primary transition-all duration-300">
            {formattedAmount}
          </span>
          {formattedOriginal && (
            <span className="font-label text-[10px] text-secondary opacity-60 mt-0.5">
              {formattedOriginal}
            </span>
          )}
        </div>
        {onRequestDelete && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRequestDelete(expense);
            }}
            disabled={isDeleting}
            className="w-9 h-9 flex items-center justify-center rounded-full text-outline hover:bg-error/10 hover:text-error disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            aria-label={`Delete ${title}`}
            title="Delete expense"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isDeleting ? 'hourglass_empty' : 'delete'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
