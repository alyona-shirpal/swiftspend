import React from 'react';
import { useRecentExpenses } from '../../hooks/useRecentExpenses';
import { ExpenseRow } from './ExpenseRow';

export const RecentSpend: React.FC = () => {
  const { data: expenses, isLoading, isError } = useRecentExpenses();
  const hasExpenses = Boolean(expenses && expenses.length > 0);

  return (
    <section className="lg:col-span-7 space-y-8 order-2 lg:order-1">
      <div className="flex justify-between items-center">
        <h3 className="font-headline text-2xl font-bold tracking-tight text-primary">Recent Spend</h3>
        <button 
          onClick={() => console.log('View All clicked')} 
          className="font-label text-xs font-bold text-secondary hover:underline uppercase tracking-widest"
        >
          View All
        </button>
      </div>
      <div className="space-y-6">
        {isLoading && (
          // Loading skeletons matching the height of a real row
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="flex items-center justify-between group animate-pulse">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-surface-container-high rounded-lg"></div>
                <div>
                  <div className="h-4 w-32 bg-surface-container-high rounded mb-2"></div>
                  <div className="h-3 w-24 bg-surface-container-highest rounded"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-5 w-16 bg-surface-container-high rounded"></div>
              </div>
            </div>
          ))
        )}

        {!isLoading && isError && (
          <div className="text-center py-10">
            <p className="text-error opacity-70">Failed to load recent expenses. Please try again.</p>
          </div>
        )}

        {!isLoading && !isError && !hasExpenses && (
          <div className="text-center py-10">
            <p className="text-secondary opacity-70">No expenses yet — add your first one above</p>
          </div>
        )}

        {!isLoading && !isError && expenses && hasExpenses && (
          expenses.map((expense) => (
            <ExpenseRow key={expense.id} expense={expense} />
          ))
        )}
      </div>
    </section>
  );
};
