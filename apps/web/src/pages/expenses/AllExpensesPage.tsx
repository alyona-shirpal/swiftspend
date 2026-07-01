import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Currency } from '@swiftspend/types';
import { useAllExpenses } from '../../hooks/useAllExpenses';
import { useCategories } from '../../hooks/useCategories';
import { useUserCurrencies, UserCurrency } from '../../hooks/useUserCurrencies';
import { ExpenseRow } from '../../components/dashboard/ExpenseRow';
import { formatCurrency } from '../../utils/formatCurrency';

export const AllExpensesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: expenses, isLoading, isError } = useAllExpenses();
  const { data: categories = [] } = useCategories();
  const { data: userCurrencies } = useUserCurrencies();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  
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

  // Filter and group expenses
  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter((e) => {
      const matchesSearch = e.description
        ? e.description.toLowerCase().includes(searchQuery.toLowerCase())
        : e.category?.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategoryId === 'all' || e.category?.id === selectedCategoryId;
      
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, selectedCategoryId]);

  // Group by Date for beautiful sectioning
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, typeof filteredExpenses> = {};
    
    filteredExpenses.forEach((e) => {
      const dateStr = e.date;
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(e);
    });

    return Object.entries(groups).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }, [filteredExpenses]);

  // Calculate total spent in selected currency for filtered view
  const totalSpentFiltered = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => {
      const amount = e.amounts?.[selectedCurrency] ?? e.amounts?.[Currency.EUR] ?? 0;
      return sum + amount;
    }, 0);
  }, [filteredExpenses, selectedCurrency]);

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
            <p className="text-xs text-outline font-medium uppercase tracking-wider mb-1">Total Spent</p>
            <h2 className="text-3xl font-headline font-black text-primary">
              {formatCurrency(totalSpentFiltered, selectedCurrency)}
            </h2>
            <p className="text-xs text-secondary mt-1">
              Showing {filteredExpenses.length} transactions
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
              placeholder="Search by description or category..."
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

          {!isLoading && !isError && filteredExpenses.length === 0 && (
            <div className="text-center py-12 bg-surface-container-lowest rounded-2xl border border-outline-variant/10">
              <span className="material-symbols-outlined text-outline text-4xl mb-2">receipt_long</span>
              <p className="text-primary font-bold">No expenses found</p>
              <p className="text-sm text-secondary">Try adjusting your search query or category filter.</p>
            </div>
          )}

          {!isLoading && !isError && groupedExpenses.map(([dateStr, items]) => (
            <div key={dateStr} className="space-y-4">
              <h3 className="font-headline text-xs font-bold text-outline uppercase tracking-wider pl-1">
                {formatDateHeader(dateStr)}
              </h3>
              <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-3 space-y-3 shadow-sm">
                {items.map((expense) => (
                  <ExpenseRow key={expense.id} expense={expense} currency={selectedCurrency} />
                ))}
              </div>
            </div>
          ))}
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
    </div>
  );
};
