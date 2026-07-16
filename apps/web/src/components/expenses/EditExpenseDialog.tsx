import React, { useState } from 'react';
import { Currency } from '@swiftspend/types';
import toast from 'react-hot-toast';
import { useCategories } from '../../hooks/useCategories';
import { useUpdateExpense } from '../../hooks/useUpdateExpense';
import { RecentExpense } from '../../types/api';

const CURRENCY_OPTIONS = [
  Currency.USD,
  Currency.EUR,
  Currency.ALL,
  Currency.UAH,
];

interface EditExpenseDialogProps {
  expense: RecentExpense;
  onClose: () => void;
}

export const EditExpenseDialog: React.FC<EditExpenseDialogProps> = ({
  expense,
  onClose,
}) => {
  const { data: categories = [] } = useCategories();
  const updateExpenseMutation = useUpdateExpense();
  const [amount, setAmount] = useState(String(expense.amount));
  const [currency, setCurrency] = useState<Currency>(expense.currency);
  const [categoryId, setCategoryId] = useState(expense.category?.id ?? '');
  const [date, setDate] = useState(expense.date);
  const [description, setDescription] = useState(expense.description ?? '');

  const closeDialog = () => {
    if (updateExpenseMutation.isPending) return;
    onClose();
  };

  const handleSave = async () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error('Enter an amount to continue.');
      return;
    }

    try {
      await updateExpenseMutation.mutateAsync({
        id: expense.id,
        amount: numericAmount,
        currency,
        category_id: categoryId || null,
        description: description.trim() || undefined,
        date: date || undefined,
      });
      toast.success('Expense updated');
      onClose();
    } catch (error) {
      console.error('Failed to update expense', error);
      toast.error('Could not update the expense.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 px-4 py-6 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-expense-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-5 shadow-2xl border border-outline-variant/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="edit-expense-title"
              className="font-headline text-lg font-bold text-primary"
            >
              Edit expense
            </h2>
            <p className="mt-1 text-sm text-secondary">
              Update the transaction details.
            </p>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            disabled={updateExpenseMutation.isPending}
            className="w-9 h-9 flex items-center justify-center rounded-full text-secondary hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            aria-label="Close edit expense"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Amount
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1 w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-primary focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                Currency
              </span>
              <select
                value={currency}
                onChange={(event) =>
                  setCurrency(event.target.value as Currency)
                }
                className="mt-1 w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-3 py-3 text-sm font-semibold text-primary focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                Date
              </span>
              <input
                type="date"
                value={date}
                max="2099-12-31"
                onChange={(event) => setDate(event.target.value)}
                className="mt-1 w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-3 py-3 text-sm font-semibold text-primary focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </label>
          </div>

          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-secondary">
              Category
            </legend>
            <div className="mt-2 grid max-h-48 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => setCategoryId('')}
                aria-pressed={categoryId === ''}
                className={`flex min-h-[4.75rem] flex-col items-center justify-center rounded-xl border px-2 py-2 text-center transition-all ${
                  categoryId === ''
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-outline-variant/20 bg-surface-container-lowest text-secondary hover:border-primary/40 hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">
                  receipt_long
                </span>
                <span className="mt-1 w-full truncate text-[10px] font-bold uppercase leading-tight">
                  None
                </span>
              </button>

              {categories.map((category) => {
                const isActive = categoryId === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setCategoryId(category.id)}
                    aria-pressed={isActive}
                    className={`flex min-h-[4.75rem] flex-col items-center justify-center rounded-xl border px-2 py-2 text-center transition-all ${
                      isActive
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-outline-variant/20 bg-surface-container-lowest text-secondary hover:border-primary/40 hover:bg-surface-container-low'
                    }`}
                    title={category.name}
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {category.icon}
                    </span>
                    <span className="mt-1 w-full truncate text-[10px] font-bold uppercase leading-tight">
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Note
            </span>
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={200}
              className="mt-1 w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-primary focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Add note..."
            />
          </label>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={closeDialog}
            disabled={updateExpenseMutation.isPending}
            className="h-11 flex-1 rounded-xl border border-outline-variant/20 bg-surface-container-low text-sm font-bold text-primary hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateExpenseMutation.isPending}
            className="h-11 flex-1 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          >
            {updateExpenseMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
