import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Currency } from '@swiftspend/types';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAddExpense } from '../../hooks/useAddExpense';
import { useCategories } from '../../hooks/useCategories';
import { useRecentCategories } from '../../hooks/useRecentCategories';
import { useExpenseNoteSuggestions } from '../../hooks/useExpenseNoteSuggestions';
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

  const savedCategoryDraft = sessionStorage.getItem(CATEGORY_DRAFT_KEY);
  
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = sessionStorage.getItem(CURRENCY_DRAFT_KEY) as Currency | null;
    return saved && CURRENCY_OPTIONS.includes(saved) ? saved : Currency.ALL;
  });
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(savedCategoryDraft ?? '');

  const quickCategories = useMemo(() => {
    const orderedCategories = [
      ...recentCategories,
      ...categories.filter((c) => !recentCategories.some((r) => r.id === c.id)),
    ];

    if (!selectedCategoryId) {
      return orderedCategories.slice(0, 12);
    }

    const selectedCategory = orderedCategories.find((category) => category.id === selectedCategoryId);
    if (!selectedCategory) {
      return orderedCategories.slice(0, 12);
    }

    return [
      selectedCategory,
      ...orderedCategories.filter((category) => category.id !== selectedCategoryId),
    ].slice(0, 12);
  }, [categories, recentCategories, selectedCategoryId]);
  
  const [note, setNote] = useState(() => sessionStorage.getItem(NOTE_DRAFT_KEY) ?? '');
  const [amountInput, setAmountInput] = useState(() => sessionStorage.getItem(AMOUNT_DRAFT_KEY) ?? '0.00');
  const [selectedDate, setSelectedDate] = useState(
    () => sessionStorage.getItem(DATE_DRAFT_KEY) ?? new Date().toISOString().split('T')[0] ?? ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const normalizedNote = note.trim().toLowerCase();
  const { data: noteSuggestions = [] } = useExpenseNoteSuggestions(selectedCategoryId, note);
  const visibleNoteSuggestions = noteSuggestions
    .filter((suggestion) => suggestion.normalized_note !== normalizedNote)
    .slice(0, 5);

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
        <div className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-2.5 md:px-6 md:py-4">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-highest transition-transform hover:scale-95"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
            <h1 className="text-base font-black uppercase tracking-widest text-primary md:text-xl">SwiftSpend</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="p-2 -mr-2 rounded-full text-secondary hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      <main className="mx-auto flex h-[calc(100dvh-120px)] w-full max-w-xl flex-col px-4 pb-0 pt-2 md:h-[calc(100dvh-140px)] md:px-6 md:pb-0 md:pt-4">
        <section className="mb-3 flex shrink-0 items-center justify-between gap-3 md:mb-6">
          <div className="flex rounded-lg bg-surface-container-low p-0.5 shadow-inner md:p-1">
            {CURRENCY_OPTIONS.map((option) => {
              const isActive = option === currency;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCurrency(option)}
                  className={`rounded-md px-2.5 py-1 text-[9px] font-headline uppercase tracking-wider transition-all md:px-4 md:py-1.5 md:text-[10px] ${
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
            className="flex items-center gap-1.5 rounded-lg bg-surface-container-low px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-surface-container md:gap-2 md:px-3 md:py-1.5 md:text-[10px]"
          >
            <span className="material-symbols-outlined text-xs md:text-sm">calendar_today</span>
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

        <section className="mb-3 shrink-0 md:mb-6">
          <p className="mb-0.5 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-secondary md:mb-1 md:text-[10px]">
            Amount to Log
          </p>
          <div className="flex items-end justify-center gap-2">
            <span className="pb-0.5 font-headline text-lg font-light text-secondary md:pb-1 md:text-2xl">
              {formatCurrency(0, currency).replace('0.00', '')}
            </span>
            <div className="font-headline text-[2.5rem] font-bold leading-none tracking-tighter text-primary md:text-[3.5rem]">
              {amountInput}
            </div>
          </div>
        </section>

        <section className="mb-3 shrink-0 md:mb-6">
          <div className="mb-1.5 flex items-end justify-between md:mb-3">
            <h2 className="text-[9px] font-bold uppercase tracking-[0.2em] text-on-surface-variant md:text-[10px]">
              Quick Category
            </h2>
            <button
              type="button"
              onClick={() => navigate('/expenses/categories')}
              className="text-[9px] font-medium text-secondary underline underline-offset-4 md:text-[10px]"
            >
              View All
            </button>
          </div>

          <div className="mx-auto grid w-full max-w-[27rem] grid-cols-6 gap-1.5 md:max-w-none md:gap-2">
            {quickCategories.map((category) => {
              const isActive = category.id === selectedCategoryId;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`flex aspect-square flex-col items-center justify-center rounded-lg border bg-white px-0.5 transition-all md:rounded-xl md:border-2 ${
                    isActive
                      ? 'border-primary shadow-md md:shadow-lg'
                      : 'border-transparent hover:border-outline-variant'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[15px] transition-colors md:text-[20px] ${
                      isActive ? 'text-primary' : 'text-secondary'
                    }`}
                  >
                    {category.icon}
                  </span>
                  <span
                    className={`mt-0.5 w-full truncate px-0.5 text-center text-[7px] font-semibold uppercase leading-tight tracking-tighter md:mt-1 md:text-[9px] ${
                      isActive ? 'text-primary' : 'text-on-surface-variant'
                    }`}
                  >
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-0 shrink-0 rounded-[1rem] bg-surface-container-low p-1 shadow-inner md:mb-0 md:rounded-[1.25rem] md:p-2">
          <div className="grid grid-cols-3 gap-0.5 md:gap-1">
            {KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleKeyPress(key)}
                className="flex items-center justify-center rounded-lg py-2 text-center font-headline text-lg font-bold transition-colors hover:bg-white active:scale-[0.98] md:rounded-xl md:py-4 md:text-2xl"
              >
                {key === 'backspace' ? (
                  <span className="material-symbols-outlined text-lg md:text-2xl">backspace</span>
                ) : (
                  key
                )}
              </button>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-surface-container-high bg-white/95 px-4 py-2.5 backdrop-blur md:px-6 md:py-4 md:left-20">
        <div className="mx-auto w-full max-w-xl pb-safe">
          {visibleNoteSuggestions.length > 0 && (
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              {visibleNoteSuggestions.map((suggestion) => (
                <button
                  key={suggestion.normalized_note}
                  type="button"
                  onClick={() => setNote(suggestion.note)}
                  className="shrink-0 rounded-full bg-surface-container-low px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-surface-container-high"
                >
                  {suggestion.note}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 md:gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Add note..."
                className="w-full rounded-lg border-none bg-surface-container-low px-3 py-2.5 pr-11 text-sm placeholder:text-secondary focus:ring-0 md:px-4 md:py-3 md:pr-12"
              />
              {note && (
                <button
                  type="button"
                  onClick={() => setNote('')}
                  aria-label="Clear note"
                  title="Clear note"
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container-high hover:text-primary"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-all active:scale-95 disabled:opacity-50 md:h-12 md:w-12"
            >
              <span className="material-symbols-outlined font-bold">check</span>
            </button>
          </div>
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
