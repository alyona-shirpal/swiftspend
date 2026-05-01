import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Currency } from '@swiftspend/types';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAddExpense } from '../../hooks/useAddExpense';
import { useCategories } from '../../hooks/useCategories';
import { useRecentCategories } from '../../hooks/useRecentCategories';
import { formatCurrency } from '../../utils/formatCurrency';

const CURRENCY_OPTIONS = [Currency.USD, Currency.EUR, Currency.ALL, Currency.UAH];
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'] as const;
const CATEGORY_DRAFT_KEY = 'swiftspend.add-expense.selected-category';
const NOTE_DRAFT_KEY = 'swiftspend.add-expense.note';
const AMOUNT_DRAFT_KEY = 'swiftspend.add-expense.amount';
const DATE_DRAFT_KEY = 'swiftspend.add-expense.date';
const CURRENCY_DRAFT_KEY = 'swiftspend.add-expense.currency';

export const AddExpensePage: React.FC = () => {
  const navigate = useNavigate();
  const { mutateAsync: addExpense } = useAddExpense();
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  const { data: categories = [] } = useCategories();
  const { data: recentCategories = [] } = useRecentCategories();
  
  const quickCategories = useMemo(() => {
    if (recentCategories.length >= 8) return recentCategories.slice(0, 8);
    const fallback = categories.filter((c) => !recentCategories.some((r) => r.id === c.id));
    return [...recentCategories, ...fallback].slice(0, 8);
  }, [categories, recentCategories]);
  
  const savedCategoryDraft = sessionStorage.getItem(CATEGORY_DRAFT_KEY);
  
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = sessionStorage.getItem(CURRENCY_DRAFT_KEY) as Currency | null;
    return saved && CURRENCY_OPTIONS.includes(saved) ? saved : Currency.ALL;
  });
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(savedCategoryDraft ?? '');
  
  const [note, setNote] = useState(() => sessionStorage.getItem(NOTE_DRAFT_KEY) ?? '');
  const [amountInput, setAmountInput] = useState(() => sessionStorage.getItem(AMOUNT_DRAFT_KEY) ?? '0.00');
  const [selectedDate, setSelectedDate] = useState(
    () => sessionStorage.getItem(DATE_DRAFT_KEY) ?? new Date().toISOString().split('T')[0] ?? ''
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!selectedCategoryId) {
      if (savedCategoryDraft) {
        setSelectedCategoryId(savedCategoryDraft);
      } else if (quickCategories.length > 0) {
        setSelectedCategoryId(quickCategories[0]!.id);
      } else if (categories.length > 0) {
        setSelectedCategoryId(categories[0]!.id);
      }
    }
  }, [selectedCategoryId, quickCategories, categories, savedCategoryDraft]);

  useEffect(() => {
    if (selectedCategoryId) {
      sessionStorage.setItem(CATEGORY_DRAFT_KEY, selectedCategoryId);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    sessionStorage.setItem(NOTE_DRAFT_KEY, note);
  }, [note]);

  useEffect(() => {
    sessionStorage.setItem(AMOUNT_DRAFT_KEY, amountInput);
  }, [amountInput]);

  useEffect(() => {
    sessionStorage.setItem(DATE_DRAFT_KEY, selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    sessionStorage.setItem(CURRENCY_DRAFT_KEY, currency);
  }, [currency]);

  const amountValue = Number(amountInput) || 0;
  const dateLabel = useMemo(() => {
    if (!selectedDate) return 'Today';

    const selected = new Date(`${selectedDate}T12:00:00`);
    const today = new Date();

    if (selected.toDateString() === today.toDateString()) {
      return 'Today';
    }

    return selected.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [selectedDate]);

  const openDatePicker = () => {
    const input = dateInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!input) return;

    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }

    input.click();
  };

  const handleKeyPress = (key: (typeof KEYS)[number]) => {
    if (key === 'backspace') {
      if (amountInput.length <= 1) {
        setAmountInput('0.00');
        return;
      }

      const trimmed = amountInput.slice(0, -1);
      setAmountInput(trimmed === '' ? '0.00' : trimmed);
      return;
    }

    if (key === '.' && amountInput.includes('.')) return;

    if (amountInput === '0.00') {
      setAmountInput(key === '.' ? '0.' : key);
      return;
    }

    setAmountInput((current) => `${current}${key}`);
  };

  const handleSave = async () => {
    if (amountValue <= 0) {
      toast.error('Enter an amount to continue.');
      return;
    }

    setIsSaving(true);
    try {
      await addExpense({
        amount: amountValue,
        currency,
        category_id: selectedCategoryId || undefined,
        description: note.trim() || undefined,
        date: selectedDate || undefined,
      });

      sessionStorage.removeItem(CATEGORY_DRAFT_KEY);
      sessionStorage.removeItem(NOTE_DRAFT_KEY);
      sessionStorage.removeItem(AMOUNT_DRAFT_KEY);
      sessionStorage.removeItem(DATE_DRAFT_KEY);
      sessionStorage.removeItem(CURRENCY_DRAFT_KEY);
      toast.success('Expense saved');
      navigate('/', { replace: true });
    } catch {
      toast.error('Could not save the expense.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen md:pl-20">
      <header className="sticky top-0 z-40 border-b border-surface-container-high bg-surface/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-highest transition-transform hover:scale-95"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
            <h1 className="text-xl font-black uppercase tracking-widest text-primary">SwiftSpend</h1>
          </div>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-surface-container-highest text-xs font-bold uppercase tracking-widest text-secondary">
            SS
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100dvh-73px)] w-full max-w-xl flex-col px-6 pb-28 pt-4">
        <section className="mb-8 flex items-center justify-between gap-4">
          <div className="flex rounded-lg bg-surface-container-low p-1 shadow-inner">
            {CURRENCY_OPTIONS.map((option) => {
              const isActive = option === currency;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCurrency(option)}
                  className={`rounded-md px-4 py-1.5 text-[10px] font-headline uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-white font-bold text-primary shadow-sm'
                      : 'font-medium text-secondary hover:bg-white/50'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={openDatePicker}
            className="flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <span>{dateLabel}</span>
          </button>
        </section>

        <input
          ref={dateInputRef}
          type="date"
          value={selectedDate}
          max="2099-12-31"
          onChange={(event) => setSelectedDate(event.target.value)}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />

        <section className="mb-12">
          <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
            Amount to Log
          </p>
          <div className="flex items-end justify-center gap-3">
            <span className="pb-3 font-headline text-2xl font-light text-secondary">
              {formatCurrency(0, currency).replace('0.00', '')}
            </span>
            <div className="font-headline text-[5rem] font-bold leading-none tracking-tighter text-primary">
              {amountInput}
            </div>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
              Quick Category
            </h2>
            <button
              type="button"
              onClick={() => navigate('/expenses/categories')}
              className="text-[10px] font-medium text-secondary underline underline-offset-4"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {quickCategories.map((category) => {
              const isActive = category.id === selectedCategoryId;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`aspect-square rounded-xl border-2 bg-white transition-all ${
                    isActive
                      ? 'border-primary shadow-lg'
                      : 'border-transparent hover:border-outline-variant'
                  }`}
                >
                  <div className="flex h-full flex-col items-center justify-center gap-2">
                    <span className={`material-symbols-outlined transition-colors ${
                      isActive ? 'text-primary' : 'text-secondary'
                    }`}>{category.icon}</span>
                    <span className={`px-1 text-center text-[10px] font-semibold uppercase tracking-tighter ${
                      isActive ? 'text-primary' : ''
                    }`}>{category.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-auto rounded-[1.25rem] bg-surface-container-low p-2 shadow-inner">
          <div className="grid grid-cols-3 gap-1">
            {KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeyPress(key)}
                className="rounded-xl py-6 text-center font-headline text-2xl font-bold transition-colors hover:bg-white active:scale-[0.98]"
              >
                {key === 'backspace' ? (
                  <span className="material-symbols-outlined text-2xl">backspace</span>
                ) : (
                  key
                )}
              </button>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-surface-container-high bg-white/95 px-6 py-4 backdrop-blur md:left-20">
        <div className="mx-auto flex w-full max-w-xl items-center gap-4 pb-safe">
          <div className="relative flex-1">
            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add note..."
              className="w-full rounded-lg border-none bg-surface-container-low px-4 py-3 text-sm placeholder:text-secondary focus:ring-0"
            />
          </div>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined font-bold">check</span>
          </button>
        </div>
      </div>

      <nav className="hidden fixed left-0 top-0 h-full w-20 flex-col items-center gap-10 border-r border-surface-container-high bg-white py-8 md:flex">
        <div className="font-headline text-xl font-black tracking-tighter">S.</div>
        <div className="flex flex-col gap-8">
          <button type="button" onClick={() => navigate('/')} className="text-secondary opacity-60">
            <span className="material-symbols-outlined">dashboard</span>
          </button>
          <button type="button" className="text-secondary opacity-60">
            <span className="material-symbols-outlined">insert_chart</span>
          </button>
          <div className="rounded-lg bg-black p-2 text-white">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              add_circle
            </span>
          </div>
          <button type="button" className="text-secondary opacity-60">
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
