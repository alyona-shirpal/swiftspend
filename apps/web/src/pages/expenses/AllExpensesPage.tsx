import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Currency } from '@swiftspend/types';
import toast from 'react-hot-toast';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAllExpenses } from '../../hooks/useAllExpenses';
import { useCategories } from '../../hooks/useCategories';
import { useUserCurrencies, UserCurrency } from '../../hooks/useUserCurrencies';
import { useDeleteExpense } from '../../hooks/useDeleteExpense';
import { useUpdateExpense } from '../../hooks/useUpdateExpense';
import { ExpenseRow } from '../../components/dashboard/ExpenseRow';
import { formatCurrency } from '../../utils/formatCurrency';
import { RecentExpense } from '../../types/api';

const CURRENCY_OPTIONS = [Currency.USD, Currency.EUR, Currency.ALL, Currency.UAH];

type ExpensesListItem =
  | { type: 'date'; id: string; date: string }
  | { type: 'expense'; id: string; expense: RecentExpense };

export const AllExpensesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const { data: userCurrencies } = useUserCurrencies();
  const deleteExpenseMutation = useDeleteExpense();
  const updateExpenseMutation = useUpdateExpense();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [expensePendingDelete, setExpensePendingDelete] = useState<RecentExpense | null>(null);
  const [expensePendingEdit, setExpensePendingEdit] = useState<RecentExpense | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCurrency, setEditCurrency] = useState<Currency>(Currency.EUR);
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);
  const {
    data,
    isLoading,
    isFetchingNextPage,
    isError,
    fetchNextPage,
    hasNextPage,
  } = useAllExpenses({
    search: searchQuery,
    categoryId: selectedCategoryId,
  });
  
  // Default to user's first currency (or EUR as fallback)
  const defaultCurrency =
    (userCurrencies?.currencies?.[0]?.currency as Currency) ?? Currency.EUR;
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(defaultCurrency);

  // Sync to user's default once loaded
  React.useEffect(() => {
    if (userCurrencies?.currencies?.[0]?.currency) {
      setSelectedCurrency(userCurrencies.currencies[0].currency as Currency);
    }
  }, [userCurrencies]);

  const expenses = useMemo(() => data?.pages.flatMap((page) => page.expenses) ?? [], [data]);
  const totalExpenses = data?.pages[0]?.total ?? 0;

  const listItems = useMemo<ExpensesListItem[]>(() => {
    const items: ExpensesListItem[] = [];
    let previousDate: string | null = null;

    expenses.forEach((expense) => {
      if (expense.date !== previousDate) {
        items.push({
          type: 'date',
          id: `date-${expense.date}`,
          date: expense.date,
        });
        previousDate = expense.date;
      }
      items.push({
        type: 'expense',
        id: expense.id,
        expense,
      });
    });

    return items;
  }, [expenses]);

  const loadedTotalSpent = useMemo(() => {
    return expenses.reduce((sum, e) => {
      const amount = e.amounts?.[selectedCurrency] ?? e.amounts?.[Currency.EUR] ?? 0;
      return sum + amount;
    }, 0);
  }, [expenses, selectedCurrency]);

  const rowVirtualizer = useVirtualizer({
    count: listItems.length,
    getScrollElement: () => listRef.current,
    estimateSize: (index) => (listItems[index]?.type === 'date' ? 36 : 86),
    getItemKey: (index) => listItems[index]?.id ?? index,
    overscan: 8,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem || !hasNextPage || isFetchingNextPage) return;

    if (lastItem.index >= listItems.length - 8) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, listItems.length, virtualItems]);

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('default', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
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

  const openEditExpense = (expense: RecentExpense) => {
    setExpensePendingEdit(expense);
    setEditAmount(String(expense.amount));
    setEditCurrency(expense.currency);
    setEditCategoryId(expense.category?.id ?? '');
    setEditDate(expense.date);
    setEditDescription(expense.description ?? '');
  };

  const closeEditExpense = () => {
    if (updateExpenseMutation.isPending) return;
    setExpensePendingEdit(null);
  };

  const handleSaveEdit = async () => {
    if (!expensePendingEdit) return;

    const amount = Number(editAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter an amount to continue.');
      return;
    }

    try {
      await updateExpenseMutation.mutateAsync({
        id: expensePendingEdit.id,
        amount,
        currency: editCurrency,
        category_id: editCategoryId || null,
        description: editDescription.trim() || undefined,
        date: editDate || undefined,
      });
      toast.success('Expense updated');
      setExpensePendingEdit(null);
    } catch (error) {
      console.error('Failed to update expense', error);
      toast.error('Could not update the expense.');
    }
  };

  const deleteTitle = expensePendingDelete?.description || expensePendingDelete?.category?.name || 'this expense';

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen pb-32">
      {/* TopAppBar */}
      <header className="bg-[#f7f9fb] flex justify-between items-center px-6 py-4 w-full docked full-width top-0 sticky z-40 border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-full text-secondary hover:bg-surface-container-low transition-colors"
            aria-label="Back to dashboard"
          >
            <span className="material-symbols-outlined text-black">arrow_back</span>
          </button>
          <h1 className="text-xl font-headline font-black text-black">
            All Expenses
          </h1>
        </div>
        
        {/* Currency Switcher */}
        {userCurrencies?.currencies && userCurrencies.currencies.length > 1 && (
          <div className="flex gap-1.5 bg-surface-container-low p-1 rounded-full border border-outline-variant/20">
            {userCurrencies.currencies.map((c: UserCurrency) => (
              <button
                key={c.currency}
                onClick={() => setSelectedCurrency(c.currency as Currency)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  selectedCurrency === c.currency
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {c.currency}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        {/* Total stats card */}
        <section className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/10 flex justify-between items-center shadow-sm">
          <div>
            <p className="text-xs text-outline font-medium uppercase tracking-wider mb-1">Loaded Spent</p>
            <h2 className="text-3xl font-headline font-black text-primary">
              {formatCurrency(loadedTotalSpent, selectedCurrency)}
            </h2>
            <p className="text-xs text-secondary mt-1">
              Showing {expenses.length} of {totalExpenses} transactions
            </p>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-2xl">account_balance_wallet</span>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="space-y-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 transform -translate-y-1/2 text-outline">search</span>
            <input
              type="text"
              placeholder="Search by description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-sm font-medium focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-outline-variant/75 transition-all"
            />
          </div>

          {/* Category Filter Badges */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-none">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                selectedCategoryId === 'all'
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-lowest text-secondary border-outline-variant/20 hover:bg-surface-container-low'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  selectedCategoryId === cat.id
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-lowest text-secondary border-outline-variant/20 hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* Expenses List */}
        <section className="space-y-4">
          {isLoading && (
            <div className="space-y-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-surface-container-low rounded-lg"></div>
                    <div>
                      <div className="h-4 w-32 bg-surface-container-low rounded mb-2"></div>
                      <div className="h-3 w-20 bg-surface-container-low rounded"></div>
                    </div>
                  </div>
                  <div className="h-5 w-16 bg-surface-container-low rounded"></div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && isError && (
            <div className="text-center py-12 bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
              <span className="material-symbols-outlined text-error text-4xl mb-2">error</span>
              <p className="text-primary font-bold">Failed to load expenses</p>
              <p className="text-sm text-secondary">Please check your network and try again.</p>
            </div>
          )}

          {!isLoading && !isError && expenses.length === 0 && (
            <div className="text-center py-12 bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
              <span className="material-symbols-outlined text-outline text-4xl mb-2">receipt_long</span>
              <p className="text-primary font-bold">No expenses found</p>
              <p className="text-sm text-secondary">Try adjusting your search query or category filter.</p>
            </div>
          )}

          {!isLoading && !isError && expenses.length > 0 && (
            <div
              ref={listRef}
              className="h-[calc(100vh-22rem)] min-h-[420px] overflow-auto pr-1"
            >
              <div
                className="relative w-full"
                style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
              >
                {virtualItems.map((virtualItem) => {
                  const item = listItems[virtualItem.index];
                  if (!item) return null;

                  return (
                    <div
                      key={virtualItem.key}
                      ref={rowVirtualizer.measureElement}
                      data-index={virtualItem.index}
                      className="absolute left-0 top-0 w-full"
                      style={{ transform: `translateY(${virtualItem.start}px)` }}
                    >
                      {item.type === 'date' ? (
                        <h3 className="font-headline text-xs font-bold text-outline uppercase tracking-wider px-1 pb-2 pt-1">
                          {formatDateHeader(item.date)}
                        </h3>
                      ) : (
                        <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-3 mb-3 shadow-sm">
                          <ExpenseRow
                            expense={item.expense}
                            currency={selectedCurrency}
                            onClick={openEditExpense}
                            onRequestDelete={setExpensePendingDelete}
                            isDeleting={deleteExpenseMutation.isPending && deleteExpenseMutation.variables === item.expense.id}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {isFetchingNextPage && (
                <div className="py-4 text-center text-xs font-bold uppercase tracking-wider text-outline">
                  Loading more expenses...
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 py-3 pb-safe bg-[#f2f4f6] border-t border-outline-variant/10">
        <a
          className="flex flex-col items-center justify-center text-black py-1"
          href="#"
          onClick={(e) => { e.preventDefault(); navigate('/'); }}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
          <span className="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Home</span>
        </a>
        <div className="relative -top-6">
          <button
            onClick={() => navigate('/expenses/new')}
            className="w-16 h-16 bg-primary text-on-primary rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] flex items-center justify-center active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-3xl font-bold">add</span>
          </button>
        </div>
        <a
          className="flex flex-col items-center justify-center text-[#47607e] opacity-60 hover:opacity-100 transition-opacity py-1"
          href="#"
          onClick={(e) => { e.preventDefault(); navigate('/reports'); }}
        >
          <span className="material-symbols-outlined">insert_chart</span>
          <span className="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Reports</span>
        </a>
      </nav>

      {expensePendingDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 px-4 py-6 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-expense-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-surface-container-lowest p-5 shadow-2xl border border-outline-variant/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 shrink-0 rounded-full bg-error/10 flex items-center justify-center text-error">
                <span className="material-symbols-outlined">delete</span>
              </div>
              <div>
                <h2 id="delete-expense-title" className="font-headline text-lg font-bold text-primary">
                  Delete expense?
                </h2>
                <p className="mt-1 text-sm text-secondary">
                  This will permanently remove "{deleteTitle}" from your expenses.
                </p>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setExpensePendingDelete(null)}
                disabled={deleteExpenseMutation.isPending}
                className="h-11 flex-1 rounded-xl border border-outline-variant/20 bg-surface-container-low text-sm font-bold text-primary hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteExpenseMutation.isPending}
                className="h-11 flex-1 rounded-xl bg-error text-white text-sm font-bold hover:bg-error/90 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
              >
                {deleteExpenseMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {expensePendingEdit && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 px-4 py-6 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-expense-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-5 shadow-2xl border border-outline-variant/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="edit-expense-title" className="font-headline text-lg font-bold text-primary">
                  Edit expense
                </h2>
                <p className="mt-1 text-sm text-secondary">
                  Update the transaction details.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditExpense}
                disabled={updateExpenseMutation.isPending}
                className="w-9 h-9 flex items-center justify-center rounded-full text-secondary hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                aria-label="Close edit expense"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">Amount</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={editAmount}
                  onChange={(event) => setEditAmount(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-primary focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">Currency</span>
                  <select
                    value={editCurrency}
                    onChange={(event) => setEditCurrency(event.target.value as Currency)}
                    className="mt-1 w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-3 py-3 text-sm font-semibold text-primary focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {CURRENCY_OPTIONS.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">Date</span>
                  <input
                    type="date"
                    value={editDate}
                    max="2099-12-31"
                    onChange={(event) => setEditDate(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-3 py-3 text-sm font-semibold text-primary focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </label>
              </div>

              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-wider text-secondary">Category</legend>
                <div className="mt-2 grid max-h-48 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setEditCategoryId('')}
                    aria-pressed={editCategoryId === ''}
                    className={`flex min-h-[4.75rem] flex-col items-center justify-center rounded-xl border px-2 py-2 text-center transition-all ${
                      editCategoryId === ''
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-outline-variant/20 bg-surface-container-lowest text-secondary hover:border-primary/40 hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">receipt_long</span>
                    <span className="mt-1 w-full truncate text-[10px] font-bold uppercase leading-tight">
                      None
                    </span>
                  </button>

                  {categories.map((category) => {
                    const isActive = editCategoryId === category.id;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setEditCategoryId(category.id)}
                        aria-pressed={isActive}
                        className={`flex min-h-[4.75rem] flex-col items-center justify-center rounded-xl border px-2 py-2 text-center transition-all ${
                          isActive
                            ? 'border-primary bg-primary/10 text-primary shadow-sm'
                            : 'border-outline-variant/20 bg-surface-container-lowest text-secondary hover:border-primary/40 hover:bg-surface-container-low'
                        }`}
                        title={category.name}
                      >
                        <span className="material-symbols-outlined text-[22px]">{category.icon}</span>
                        <span className="mt-1 w-full truncate text-[10px] font-bold uppercase leading-tight">
                          {category.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">Note</span>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(event) => setEditDescription(event.target.value)}
                  maxLength={200}
                  className="mt-1 w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-primary focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Add note..."
                />
              </label>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={closeEditExpense}
                disabled={updateExpenseMutation.isPending}
                className="h-11 flex-1 rounded-xl border border-outline-variant/20 bg-surface-container-low text-sm font-bold text-primary hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={updateExpenseMutation.isPending}
                className="h-11 flex-1 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
              >
                {updateExpenseMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
