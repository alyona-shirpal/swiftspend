import React from 'react';
import { RecentExpense } from '../../types/api';
import { formatCurrency } from '../../utils/formatCurrency';
import { Currency } from '@swiftspend/types';

interface ExpenseRowProps {
  expense: RecentExpense;
}

export const ExpenseRow: React.FC<ExpenseRowProps> = ({ expense }) => {
  // Format the subtitle time/date
  const formatTime = (dateString: string, timeString: string) => {
    const expenseDate = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = expenseDate.toDateString() === today.toDateString();
    const isYesterday = expenseDate.toDateString() === yesterday.toDateString();

    if (isToday) {
      // Use time from created_at
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

  // Amount is always shown as negative EUR value per design
  const eurAmount = expense.amounts?.[Currency.EUR] ?? 0;
  const formattedEur = `-${formatCurrency(eurAmount, Currency.EUR)}`;
  
  // Show original currency if different from EUR
  const hasOriginalCurrency = expense.currency !== Currency.EUR;
  const formattedOriginal = hasOriginalCurrency 
    ? `paid in ${formatCurrency(expense.amount, expense.currency)}` 
    : null;

  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 flex items-center justify-center bg-surface-container-low dark:bg-slate-800 rounded-lg group-hover:bg-surface-container-highest transition-colors">
          <span className="material-symbols-outlined text-primary dark:text-white">{icon}</span>
        </div>
        <div>
          <h4 className="font-body text-md font-semibold text-primary dark:text-white">{title}</h4>
          <p className="font-label text-xs text-secondary opacity-70">
            {categoryName} • {subtitleTime}
          </p>
        </div>
      </div>
      <div className="text-right flex flex-col items-end">
        <span className="font-body font-bold text-primary dark:text-white">{formattedEur}</span>
        {formattedOriginal && (
          <span className="font-label text-[10px] text-secondary opacity-60 mt-0.5">{formattedOriginal}</span>
        )}
      </div>
    </div>
  );
};
