import React, { useEffect } from 'react';
import { RecentExpense } from '../../types/api';

interface DeleteExpenseDialogProps {
  expense: RecentExpense;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export const DeleteExpenseDialog: React.FC<DeleteExpenseDialogProps> = ({
  expense,
  isDeleting,
  onCancel,
  onConfirm,
}) => {
  const expenseTitle =
    expense.merchant ||
    expense.description ||
    expense.category?.name ||
    'this expense';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) onCancel();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDeleting, onCancel]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 px-4 py-6 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-expense-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) onCancel();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error/10 text-error">
            <span className="material-symbols-outlined">delete</span>
          </div>
          <div>
            <h2
              id="delete-expense-title"
              className="font-headline text-lg font-bold text-primary"
            >
              Delete expense?
            </h2>
            <p className="mt-1 text-sm text-secondary">
              This will permanently remove “{expenseTitle}” from your expenses.
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="h-11 flex-1 rounded-xl border border-outline-variant/20 bg-surface-container-low text-sm font-bold text-primary transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isDeleting}
            className="h-11 flex-1 rounded-xl bg-error text-sm font-bold text-white transition-colors hover:bg-error/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
