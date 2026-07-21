import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Currency } from '@swiftspend/types';
import toast from 'react-hot-toast';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAllExpenses } from '../../hooks/useAllExpenses';
import { useCategories } from '../../hooks/useCategories';
import { useUserCurrencies } from '../../hooks/useUserCurrencies';
import { useDeleteExpense } from '../../hooks/useDeleteExpense';
import { ExpenseRow } from '../../components/dashboard/ExpenseRow';
import { DeleteExpenseDialog } from '../../components/expenses/DeleteExpenseDialog';
import { EditExpenseDialog } from '../../components/expenses/EditExpenseDialog';
import {
  AppLayout,
  HeaderCurrencyToggle,
} from '../../components/layout/AppLayout';
import { formatCurrency } from '../../utils/formatCurrency';
import { RecentExpense } from '../../types/api';

type ExpensesListItem =
  | { type: 'date'; id: string; date: string }
  | { type: 'expense'; id: string; expense: RecentExpense };

export const AllExpensesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const { data: userCurrencies } = useUserCurrencies();
  const deleteExpenseMutation = useDeleteExpense();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [expensePendingDelete, setExpensePendingDelete] =
    useState<RecentExpense | null>(null);
  const [expensePendingEdit, setExpensePendingEdit] =
    useState<RecentExpense | null>(null);
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
  const [selectedCurrency, setSelectedCurrency] =
    useState<Currency>(defaultCurrency);

  // Sync to user's default once loaded
  React.useEffect(() => {
    if (userCurrencies?.currencies?.[0]?.currency) {
      setSelectedCurrency(userCurrencies.currencies[0].currency as Currency);
    }
  }, [userCurrencies]);

  const expenses = useMemo(
    () => data?.pages.flatMap((page) => page.expenses) ?? [],
    [data],
  );
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
      const amount =
        e.amounts?.[selectedCurrency] ?? e.amounts?.[Currency.EUR] ?? 0;
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
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    listItems.length,
    virtualItems,
  ]);

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

  const handleViewExpense = (expense: RecentExpense) => {
    navigate(`/expenses/${expense.id}`, { state: { from: '/expenses' } });
  };

  const handleEditExpense = (expense: RecentExpense) => {
    setExpensePendingEdit(expense);
  };

  const handleDeleteRequest = (expense: RecentExpense) => {
    setExpensePendingDelete(expense);
  };

  return (
    <AppLayout
      title="All Expenses"
      backTo="/"
      actions={
        <HeaderCurrencyToggle
          options={userCurrencies?.currencies?.map((c) => c.currency) ?? []}
          value={selectedCurrency}
          onChange={(currency) => setSelectedCurrency(currency as Currency)}
        />
      }
      width="3xl"
      mainClassName="space-y-4"
    >
        {/* Total stats card */}
        <section className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/10 flex justify-between items-center shadow-sm">
          <div>
            <p className="text-xs text-outline font-medium uppercase tracking-wider mb-1">
              Loaded Spent
            </p>
            <h2 className="text-3xl font-headline font-black text-primary">
              {formatCurrency(loadedTotalSpent, selectedCurrency)}
            </h2>
            <p className="text-xs text-secondary mt-1">
              Showing {expenses.length} of {totalExpenses} transactions
            </p>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-2xl">
              account_balance_wallet
            </span>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="space-y-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 transform -translate-y-1/2 text-outline">
              search
            </span>
            <input
              type="text"
              placeholder="Search by merchant or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-sm font-medium focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-outline-variant/75 transition-all"
            />
          </div>

          {/* Category Filter Badges */}
          <div className="flex w-full max-w-full gap-2 overflow-x-auto pb-2 scrollbar-none">
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
                <span className="material-symbols-outlined text-[14px]">
                  {cat.icon}
                </span>
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
                <div
                  key={i}
                  className="flex items-center justify-between animate-pulse"
                >
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
              <span className="material-symbols-outlined text-error text-4xl mb-2">
                error
              </span>
              <p className="text-primary font-bold">Failed to load expenses</p>
              <p className="text-sm text-secondary">
                Please check your network and try again.
              </p>
            </div>
          )}

          {!isLoading && !isError && expenses.length === 0 && (
            <div className="text-center py-12 bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
              <span className="material-symbols-outlined text-outline text-4xl mb-2">
                receipt_long
              </span>
              <p className="text-primary font-bold">No expenses found</p>
              <p className="text-sm text-secondary">
                Try adjusting your search query or category filter.
              </p>
            </div>
          )}

          {!isLoading && !isError && expenses.length > 0 && (
            <div
              ref={listRef}
              className="h-[calc(100vh-22rem)] min-h-[420px] max-w-full overflow-y-auto overflow-x-hidden pr-1"
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
                      style={{
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
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
                            onRequestView={handleViewExpense}
                            onRequestEdit={handleEditExpense}
                            onRequestDelete={handleDeleteRequest}
                            isDeleting={
                              deleteExpenseMutation.isPending &&
                              deleteExpenseMutation.variables ===
                                item.expense.id
                            }
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

      {expensePendingDelete && (
        <DeleteExpenseDialog
          expense={expensePendingDelete}
          isDeleting={deleteExpenseMutation.isPending}
          onCancel={() => setExpensePendingDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {expensePendingEdit && (
        <EditExpenseDialog
          key={expensePendingEdit.id}
          expense={expensePendingEdit}
          onClose={() => setExpensePendingEdit(null)}
        />
      )}
    </AppLayout>
  );
};
