import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useRecentExpenses } from '../../hooks/useRecentExpenses';
import { useDeleteExpense } from '../../hooks/useDeleteExpense';
import { ExpenseRow } from './ExpenseRow';
import { Currency } from '@swiftspend/types';
import { DeleteExpenseDialog } from '../expenses/DeleteExpenseDialog';
import { EditExpenseDialog } from '../expenses/EditExpenseDialog';
import { RecentExpense } from '../../types/api';

interface RecentSpendProps {
  currency: Currency;
}

export const RecentSpend: React.FC<RecentSpendProps> = ({ currency }) => {
  const navigate = useNavigate();
  const { data: expenses, isLoading, isError } = useRecentExpenses();
  const deleteExpenseMutation = useDeleteExpense();
  const [expensePendingEdit, setExpensePendingEdit] =
    useState<RecentExpense | null>(null);
  const [expensePendingDelete, setExpensePendingDelete] =
    useState<RecentExpense | null>(null);
  const hasExpenses = Boolean(expenses && expenses.length > 0);

  const handleViewExpense = (expense: RecentExpense) => {
    navigate(`/expenses/${expense.id}`, { state: { from: '/' } });
  };

  const handleEditExpense = (expense: RecentExpense) => {
    setExpensePendingEdit(expense);
  };

  const handleDeleteRequest = (expense: RecentExpense) => {
    setExpensePendingDelete(expense);
  };

  const handleConfirmDelete = async () => {
    if (!expensePendingDelete) return;

    try {
      await deleteExpenseMutation.mutateAsync(expensePendingDelete.id);
      toast.success('Expense deleted');
      setExpensePendingDelete(null);
    } catch (error) {
      console.error('Failed to delete expense', error);
      toast.error('Could not delete the expense.');
    }
  };

  return (
    <section className="lg:col-span-7 space-y-4 order-2 lg:order-1">
      <div className="flex justify-between items-center">
        <h3 className="font-headline text-2xl font-bold tracking-tight text-primary">
          Recent Spend
        </h3>
        <button
          onClick={() => navigate('/expenses')}
          className="font-label text-xs font-bold text-secondary hover:underline uppercase tracking-widest"
        >
          View All
        </button>
      </div>
      <div className="space-y-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="flex items-center justify-between group animate-pulse"
            >
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
          ))}

        {!isLoading && isError && (
          <div className="text-center py-10">
            <p className="text-error opacity-70">
              Failed to load recent expenses. Please try again.
            </p>
          </div>
        )}

        {!isLoading && !isError && !hasExpenses && (
          <div className="text-center py-10">
            <p className="text-secondary opacity-70">
              No expenses yet — add your first one above
            </p>
          </div>
        )}

        {!isLoading &&
          !isError &&
          expenses &&
          hasExpenses &&
          expenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              currency={currency}
              onRequestView={handleViewExpense}
              onRequestEdit={handleEditExpense}
              onRequestDelete={handleDeleteRequest}
              isDeleting={
                deleteExpenseMutation.isPending &&
                deleteExpenseMutation.variables === expense.id
              }
            />
          ))}
      </div>

      {expensePendingEdit && (
        <EditExpenseDialog
          key={expensePendingEdit.id}
          expense={expensePendingEdit}
          onClose={() => setExpensePendingEdit(null)}
        />
      )}

      {expensePendingDelete && (
        <DeleteExpenseDialog
          expense={expensePendingDelete}
          isDeleting={deleteExpenseMutation.isPending}
          onCancel={() => setExpensePendingDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </section>
  );
};
