import React, { useState } from 'react';
import { Currency, Expense } from '@swiftspend/types';
import { ReportCategory } from '../../types/reports';
import { formatCurrency } from '../../utils/formatCurrency';
import { useReportCategoryExpenses } from '../../hooks/useReportCategoryExpenses';

interface ReportPeriodRange {
  from: string;
  to: string;
}

interface TopCategoriesAccordionProps {
  categories: ReportCategory[];
  currency: Currency;
  periodRange: ReportPeriodRange;
  className?: string;
  titleClassName?: string;
  itemClassName?: string;
  headerClassName?: string;
  showTransactionCount?: boolean;
}

function getExpenseAmount(expense: Expense, currency: Currency): number {
  return expense.amounts?.[currency] ?? (expense.currency === currency ? expense.amount : 0);
}

function groupExpensesByComment(expenses: Expense[], currency: Currency) {
  const groups = new Map<string, { comment: string; total: number; count: number }>();

  expenses.forEach((expense) => {
    const comment = expense.description?.trim() || 'No comment';
    const key = expense.normalized_description || comment.toLowerCase();
    const existing = groups.get(key);
    const amount = getExpenseAmount(expense, currency);

    if (existing) {
      existing.total += amount;
      existing.count += 1;
    } else {
      groups.set(key, { comment, total: amount, count: 1 });
    }
  });

  return Array.from(groups.values()).sort((a, b) => b.total - a.total);
}

function CategoryTransactions({
  categoryId,
  currency,
  periodRange,
}: {
  categoryId: string | null;
  currency: Currency;
  periodRange: ReportPeriodRange;
}) {
  const { data: expenses = [], isLoading, error, refetch } = useReportCategoryExpenses({
    from: periodRange.from,
    to: periodRange.to,
    categoryId,
    currency,
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="py-3 text-xs font-medium text-secondary">
        Loading transactions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-3 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-error">Could not load transactions</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-xs font-bold text-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="py-3 text-xs font-medium text-secondary">
        No transactions found for this category.
      </div>
    );
  }

  const groupedExpenses = groupExpensesByComment(expenses, currency);

  return (
    <div className="mt-3 space-y-2">
      {groupedExpenses.map((group) => (
        <div
          key={group.comment}
          className="flex items-start justify-between gap-3 rounded-lg bg-surface-container-low px-3 py-2"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-primary break-words">
              {group.comment}
            </p>
            {group.count > 1 && (
              <p className="mt-0.5 text-[10px] font-medium text-secondary">
                {group.count} transactions
              </p>
            )}
          </div>
          <p className="shrink-0 text-xs font-bold text-primary">
            {formatCurrency(group.total, currency)}
          </p>
        </div>
      ))}
    </div>
  );
}

export const TopCategoriesAccordion: React.FC<TopCategoriesAccordionProps> = ({
  categories,
  currency,
  periodRange,
  className = '',
  titleClassName = 'text-lg font-bold font-headline text-primary',
  itemClassName = 'px-4 py-3',
  headerClassName = '',
  showTransactionCount = true,
}) => {
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  return (
    <section className={className}>
      <div className={headerClassName}>
        <h3 className={titleClassName}>Top Categories Spending</h3>
      </div>
      <div className="divide-y divide-surface-container-low">
        {categories.map((category) => {
          const categoryKey = category.id ?? 'uncategorized';
          const isExpanded = expandedCategoryId === categoryKey;

          return (
            <div key={categoryKey} className={itemClassName}>
              <button
                type="button"
                onClick={() => setExpandedCategoryId(isExpanded ? null : categoryKey)}
                aria-expanded={isExpanded}
                className="w-full text-left focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-surface-container-low flex items-center justify-center rounded-lg">
                    <span className="material-symbols-outlined text-primary">{category.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-primary truncate">{category.name}</h4>
                        {showTransactionCount && (
                          <p className="text-[10px] text-on-surface-variant font-medium">
                            {category.count} Transactions
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-sm font-headline font-bold text-primary">
                        {formatCurrency(category.total, currency)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-secondary">{category.percentage}%</span>
                      <span className="material-symbols-outlined text-base text-secondary">
                        {isExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
              {isExpanded && (
                <div className="pl-14">
                  <CategoryTransactions
                    categoryId={category.id}
                    currency={currency}
                    periodRange={periodRange}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
