import React, { useMemo, useState } from 'react';
import { Currency } from '@swiftspend/types';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { DeleteExpenseDialog } from '../../components/expenses/DeleteExpenseDialog';
import { EditExpenseDialog } from '../../components/expenses/EditExpenseDialog';
import { useDeleteExpense } from '../../hooks/useDeleteExpense';
import { useExpense } from '../../hooks/useExpense';
import { RecentExpense } from '../../types/api';
import { formatCurrency } from '../../utils/formatCurrency';

const receiptEdgeStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  backgroundImage:
    'radial-gradient(circle at 6px 0, transparent 5.5px, #fffdf7 6px)',
  backgroundRepeat: 'repeat-x',
  backgroundSize: '12px 12px',
};

export const ExpenseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: expense, isLoading, isError, refetch } = useExpense(id);
  const deleteExpenseMutation = useDeleteExpense();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const from = (location.state as { from?: string } | null)?.from;
  const backPath = from === '/' ? '/' : '/expenses';

  const expenseForActions = useMemo<RecentExpense | null>(() => {
    if (!expense) return null;

    return {
      id: expense.id,
      merchant: expense.merchant,
      normalized_merchant: expense.normalized_merchant,
      description: expense.description,
      normalized_description: expense.normalized_description,
      date: expense.date,
      time: expense.created_at,
      amount: expense.amount,
      currency: expense.currency,
      amounts: expense.amounts,
      category: expense.category,
    };
  }, [expense]);

  const handleBack = () => navigate(backPath);
  const handleEditRequest = () => setIsEditOpen(true);
  const handleDeleteRequest = () => setIsDeleteOpen(true);

  const handleConfirmDelete = async () => {
    if (!expense) return;

    try {
      await deleteExpenseMutation.mutateAsync(expense.id);
      toast.success('Expense deleted');
      navigate(backPath, { replace: true });
    } catch (error) {
      console.error('Failed to delete expense', error);
      toast.error('Could not delete the expense.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface">
        <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-secondary/20 border-t-primary" />
      </div>
    );
  }

  if (isError || !expense || !expenseForActions) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-surface px-6 text-center">
        <span className="material-symbols-outlined text-5xl text-outline">
          receipt_long
        </span>
        <h1 className="mt-4 font-headline text-2xl font-black text-primary">
          Expense not found
        </h1>
        <p className="mt-2 max-w-sm text-sm text-secondary">
          This receipt may have been removed or is no longer available.
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-on-primary"
        >
          Back to expenses
        </button>
      </div>
    );
  }

  const transactionDate = new Date(`${expense.date}T12:00:00`);
  const createdAt = new Date(expense.created_at);
  const descriptionLines = expense.description
    ?.split(/;\s*|\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const convertedAmounts = Object.entries(expense.amounts ?? {}).filter(
    ([currency, amount]) =>
      currency !== expense.currency && typeof amount === 'number',
  );

  return (
    <div className="min-h-[100dvh] bg-surface pb-10 font-body text-on-surface">
      <header className="sticky top-0 z-40 border-b border-outline-variant/10 bg-surface/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-low"
            aria-label="Back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="text-center">
            <p className="font-label text-[9px] font-bold uppercase tracking-[0.24em] text-secondary">
              Transaction
            </p>
            <h1 className="font-headline text-lg font-black text-primary">
              Receipt
            </h1>
          </div>
          <div className="h-10 w-10" aria-hidden="true" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 sm:py-8">
        <article className="drop-shadow-[0_20px_35px_rgba(25,28,30,0.16)]">
          <div className="h-3" style={receiptEdgeStyle} aria-hidden="true" />
          <div className="bg-[#fffdf7] px-5 py-6 sm:px-8 sm:py-8">
            <div className="text-center">
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm"
                style={{
                  backgroundColor: expense.category?.color ?? '#45474a',
                }}
              >
                <span className="material-symbols-outlined text-[28px]">
                  {expense.category?.icon ?? 'receipt_long'}
                </span>
              </div>
              <p className="mt-4 font-label text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                {expense.category?.name ?? 'Uncategorized'}
              </p>
              <h2 className="mt-1 font-headline text-2xl font-black text-primary sm:text-3xl">
                {expense.merchant || 'Expense'}
              </h2>
              <p className="mt-2 font-mono text-xs uppercase tracking-wider text-outline">
                {transactionDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                })}{' '}
                ·{' '}
                {createdAt.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="my-6 border-t border-dashed border-outline-variant" />

            <div className="space-y-3 font-mono text-sm">
              {descriptionLines?.length ? (
                descriptionLines.map((line, index) => (
                  <div key={`${line}-${index}`} className="flex gap-3">
                    <span className="text-outline">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1 whitespace-pre-wrap text-primary">
                      {line}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between gap-3 text-secondary">
                  <span>Details</span>
                  <span>No note</span>
                </div>
              )}
            </div>

            <div className="my-6 border-t border-dashed border-outline-variant" />

            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
                  Total paid
                </p>
                <p className="mt-1 font-mono text-xs text-outline">
                  {expense.currency} · original amount
                </p>
              </div>
              <p className="font-headline text-3xl font-black text-primary sm:text-4xl">
                {formatCurrency(expense.amount, expense.currency)}
              </p>
            </div>

            {convertedAmounts.length > 0 && (
              <div className="mt-5 rounded-xl bg-surface-container-low/70 px-4 py-3">
                <p className="font-label text-[9px] font-bold uppercase tracking-[0.2em] text-secondary">
                  Converted values
                </p>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs text-primary">
                  {convertedAmounts.map(([currency, amount]) => (
                    <div key={currency} className="flex justify-between gap-2">
                      <span>{currency}</span>
                      <span>
                        {formatCurrency(amount as number, currency as Currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-dashed border-outline-variant pt-4 text-center font-mono text-[10px] uppercase tracking-wider text-outline">
              <p>Expense #{expense.id.slice(0, 8)}</p>
              <p className="mt-1">
                Recorded {createdAt.toLocaleDateString('en-US')}
              </p>
            </div>
          </div>
          <div
            className="h-3 rotate-180"
            style={receiptEdgeStyle}
            aria-hidden="true"
          />
        </article>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleEditRequest}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-label text-sm font-bold text-on-primary shadow-lg transition-transform active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
            Edit
          </button>
          <button
            type="button"
            onClick={handleDeleteRequest}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-error/20 bg-error/10 font-label text-sm font-bold text-error transition-colors hover:bg-error/15"
          >
            <span className="material-symbols-outlined text-[20px]">
              delete
            </span>
            Delete
          </button>
        </div>
      </main>

      {isEditOpen && (
        <EditExpenseDialog
          key={expenseForActions.id}
          expense={expenseForActions}
          onClose={() => setIsEditOpen(false)}
          onSaved={async () => {
            await refetch();
          }}
        />
      )}

      {isDeleteOpen && (
        <DeleteExpenseDialog
          expense={expenseForActions}
          isDeleting={deleteExpenseMutation.isPending}
          onCancel={() => setIsDeleteOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};
