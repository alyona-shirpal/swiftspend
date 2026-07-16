import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Currency } from '@swiftspend/types';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useEmblaCarousel from 'embla-carousel-react';
import { AnimatedBrandText } from '../../components/layout/AnimatedBrandText';
import { useAddExpense } from '../../hooks/useAddExpense';
import { useCategories } from '../../hooks/useCategories';
import { useRecentCategories } from '../../hooks/useRecentCategories';
import { useExpenseNoteSuggestions } from '../../hooks/useExpenseNoteSuggestions';
import { formatCurrency } from '../../utils/formatCurrency';
import { ExpenseDocumentUpload } from '../../components/expenses/ExpenseDocumentUpload';
import {
  getDocumentProcessingErrorMessage,
  ParsedDocumentExpense,
} from '../../services/expenses';
import { processSharedExpenseDocument } from '../../services/sharedExpenseDocument';

const CURRENCY_OPTIONS = [
  Currency.USD,
  Currency.EUR,
  Currency.ALL,
  Currency.UAH,
];
const KEYS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '.',
  '0',
  'backspace',
] as const;
const CATEGORY_DRAFT_KEY = 'swiftspend.add-expense.selected-category';
const NOTE_DRAFT_KEY = 'swiftspend.add-expense.note';
const AMOUNT_DRAFT_KEY = 'swiftspend.add-expense.amount';
const DATE_DRAFT_KEY = 'swiftspend.add-expense.date';
const CURRENCY_DRAFT_KEY = 'swiftspend.add-expense.currency';
const QUICK_CATEGORY_PAGE_SIZE = 12;

export const AddExpensePage: React.FC = () => {
  const navigate = useNavigate();
  const { mutateAsync: addExpense } = useAddExpense();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: false,
  });
  const [selectedCategoryPage, setSelectedCategoryPage] = useState(0);

  const { data: categories = [] } = useCategories();
  const { data: recentCategories = [] } = useRecentCategories();

  const savedCategoryDraft = sessionStorage.getItem(CATEGORY_DRAFT_KEY);

  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = sessionStorage.getItem(CURRENCY_DRAFT_KEY) as Currency | null;
    return saved && CURRENCY_OPTIONS.includes(saved) ? saved : Currency.ALL;
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    savedCategoryDraft ?? '',
  );

  const quickCategories = useMemo(() => {
    return [
      ...recentCategories,
      ...categories.filter((c) => !recentCategories.some((r) => r.id === c.id)),
    ];
  }, [categories, recentCategories]);

  const quickCategoryPages = useMemo(() => {
    const pages: (typeof quickCategories)[] = [];

    for (
      let index = 0;
      index < quickCategories.length;
      index += QUICK_CATEGORY_PAGE_SIZE
    ) {
      pages.push(
        quickCategories.slice(index, index + QUICK_CATEGORY_PAGE_SIZE),
      );
    }

    return pages;
  }, [quickCategories]);

  const [note, setNote] = useState(
    () => sessionStorage.getItem(NOTE_DRAFT_KEY) ?? '',
  );
  const [amountInput, setAmountInput] = useState(
    () => sessionStorage.getItem(AMOUNT_DRAFT_KEY) ?? '0.00',
  );
  const [selectedDate, setSelectedDate] = useState(
    () =>
      sessionStorage.getItem(DATE_DRAFT_KEY) ??
      new Date().toISOString().split('T')[0] ??
      '',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingSharedDocument, setIsProcessingSharedDocument] =
    useState(false);
  const [isParsedTransactionPending, setIsParsedTransactionPending] =
    useState(false);
  const [sharedDocumentId] = useState(() =>
    new URLSearchParams(window.location.search).get('sharedDocument'),
  );
  const [shareError] = useState(() =>
    new URLSearchParams(window.location.search).get('shareError'),
  );
  const normalizedNote = note.trim().toLowerCase();
  const { data: noteSuggestions = [] } = useExpenseNoteSuggestions(
    selectedCategoryId,
    note,
  );
  const visibleNoteSuggestions = noteSuggestions
    .filter((suggestion) => suggestion.normalized_note !== normalizedNote)
    .slice(0, 5);

  const applyParsedExpense = useCallback((expense: ParsedDocumentExpense) => {
    setAmountInput(String(expense.amount));
    setCurrency(expense.currency as Currency);
    setSelectedCategoryId(expense.category_id);
    setSelectedDate(expense.date);
    setNote(expense.description);
    setIsParsedTransactionPending(true);
  }, []);

  useEffect(() => {
    const documentId = sharedDocumentId;
    if (!documentId && !shareError) return undefined;

    window.history.replaceState(window.history.state, '', '/expenses/new');

    if (shareError) {
      toast.error(
        shareError === 'missing-file'
          ? 'No document was included in the share.'
          : 'Could not receive the shared document. Share it again.',
      );
      return undefined;
    }

    if (!documentId) return undefined;

    let isActive = true;
    setIsProcessingSharedDocument(true);

    void processSharedExpenseDocument(documentId)
      .then(({ result }) => {
        if (!isActive) return;
        if (result.status !== 'parsed') {
          throw new Error('The shared document was saved before confirmation.');
        }

        applyParsedExpense(result.expense);
        toast.success('Transaction parsed. Review the details and confirm it.');
      })
      .catch((error) => {
        if (isActive) {
          toast.error(getDocumentProcessingErrorMessage(error));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsProcessingSharedDocument(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [applyParsedExpense, shareError, sharedDocumentId]);

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

  useEffect(() => {
    if (!emblaApi) return undefined;

    const updateSelectedPage = () =>
      setSelectedCategoryPage(emblaApi.selectedScrollSnap());
    updateSelectedPage();
    emblaApi.on('select', updateSelectedPage);
    emblaApi.on('reInit', updateSelectedPage);

    return () => {
      emblaApi.off('select', updateSelectedPage);
      emblaApi.off('reInit', updateSelectedPage);
    };
  }, [emblaApi, quickCategoryPages.length]);

  useEffect(() => {
    emblaApi?.reInit();
  }, [emblaApi, quickCategoryPages.length]);

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

      setIsParsedTransactionPending(false);

      sessionStorage.removeItem(CATEGORY_DRAFT_KEY);
      sessionStorage.removeItem(NOTE_DRAFT_KEY);
      sessionStorage.removeItem(AMOUNT_DRAFT_KEY);
      sessionStorage.removeItem(DATE_DRAFT_KEY);
      sessionStorage.removeItem(CURRENCY_DRAFT_KEY);
      toast.success('Expense added', {
        style: {
          background: '#009668',
          color: '#ffffff',
          border: '1px solid rgba(255, 255, 255, 0.28)',
          borderRadius: '0.75rem',
          boxShadow: '0 18px 45px rgba(0, 0, 0, 0.16)',
          fontWeight: 700,
        },
      });
      navigate('/', { replace: true });
    } catch {
      toast.error('Could not save the expense.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-surface text-on-surface font-body md:pl-20">
      <div className="flex min-h-0 w-full flex-col">
        <header className="z-40 shrink-0 border-b border-surface-container-high bg-surface/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-2 md:px-6 md:py-3">
            <div className="flex items-center gap-2 md:gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-highest transition-transform hover:scale-95"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
              <h1 className="text-base font-black uppercase tracking-widest text-primary md:text-xl">
                <AnimatedBrandText compact />
              </h1>
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

        <main className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col px-4 pt-2 md:px-6 md:pt-4">
          <section className="mb-2 flex shrink-0 items-center justify-between gap-3 md:mb-4">
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

            <div className="group relative">
              <button
                type="button"
                className="pointer-events-none flex items-center gap-1.5 rounded-lg bg-surface-container-low px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-primary transition-colors group-hover:bg-surface-container md:gap-2 md:px-3 md:py-1.5 md:text-[10px]"
              >
                <span className="material-symbols-outlined text-xs md:text-sm">
                  calendar_today
                </span>
                <span>{dateLabel}</span>
              </button>
              <input
                type="date"
                value={selectedDate}
                max="2099-12-31"
                onChange={(event) => setSelectedDate(event.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
          </section>

          <section className="mb-2 shrink-0 md:mb-4">
            <p className="mb-0.5 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-secondary md:mb-1 md:text-[10px]">
              Amount to Log
            </p>
            <div className="flex items-end justify-center gap-2">
              <span className="pb-0.5 font-headline text-lg font-light text-secondary md:pb-1 md:text-2xl">
                {formatCurrency(0, currency).replace('0.00', '')}
              </span>
              <div className="font-headline text-[2.65rem] font-bold leading-none tracking-normal text-primary md:text-[3.75rem]">
                {amountInput}
              </div>
            </div>
          </section>

          <section className="mb-2 min-h-0 flex-1 overflow-hidden md:mb-4">
            <div className="mb-1.5 flex justify-end md:mb-3">
              <button
                type="button"
                onClick={() => navigate('/expenses/categories')}
                className="text-[9px] font-medium text-secondary underline underline-offset-4 md:text-[10px]"
              >
                View All
              </button>
            </div>

            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex touch-pan-y">
                {(quickCategoryPages.length > 0
                  ? quickCategoryPages
                  : [[]]
                ).map((page, pageIndex) => (
                  <div key={pageIndex} className="min-w-0 flex-[0_0_100%]">
                    <div className="grid grid-cols-4 grid-rows-3 gap-1.5 md:gap-2">
                      {page.map((category) => {
                        const isActive = category.id === selectedCategoryId;
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => setSelectedCategoryId(category.id)}
                            className={`flex h-[clamp(2.6rem,8dvh,3.1rem)] min-w-0 flex-col items-center justify-center rounded-lg border bg-white px-1 text-center shadow-sm transition-all active:scale-[0.97] md:h-16 md:rounded-xl md:border-2 md:px-2 ${
                              isActive
                                ? 'border-primary shadow-md md:shadow-lg'
                                : 'border-transparent hover:border-outline-variant'
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined shrink-0 text-[17px] transition-colors md:text-[23px] ${
                                isActive ? 'text-primary' : 'text-secondary'
                              }`}
                            >
                              {category.icon}
                            </span>
                            <span
                              className={`mt-0.5 w-full min-w-0 truncate text-[7px] font-semibold uppercase leading-tight md:text-[9px] ${
                                isActive
                                  ? 'text-primary'
                                  : 'text-on-surface-variant'
                              }`}
                            >
                              {category.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {quickCategoryPages.length > 1 && (
              <div className="mt-2 flex justify-center gap-1.5">
                {quickCategoryPages.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Show quick category page ${index + 1}`}
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      selectedCategoryPage === index
                        ? 'w-5 bg-primary'
                        : 'w-1.5 bg-outline-variant'
                    }`}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="mb-2 shrink-0 rounded-[1rem] bg-white p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.08)] ring-1 ring-outline-variant/30 md:mb-4 md:rounded-[1.25rem] md:p-2">
            <div className="grid grid-cols-3 gap-1 md:gap-1.5">
              {KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeyPress(key)}
                  className="flex h-[clamp(2.1rem,8dvh,2.45rem)] items-center justify-center rounded-lg bg-surface-container-low text-center font-headline text-xl font-black text-primary shadow-[inset_0_-2px_0_rgba(0,0,0,0.08)] transition-all hover:bg-surface-container active:translate-y-0.5 active:scale-[0.96] active:bg-secondary-fixed md:h-14 md:rounded-xl md:text-3xl"
                >
                  {key === 'backspace' ? (
                    <span className="material-symbols-outlined text-xl md:text-3xl">
                      backspace
                    </span>
                  ) : (
                    key
                  )}
                </button>
              ))}
            </div>
          </section>
        </main>

        <div className="shrink-0 border-t border-surface-container-high bg-white/95 px-4 py-2 backdrop-blur md:px-6 md:py-3">
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
              <ExpenseDocumentUpload
                disabled={isSaving || isProcessingSharedDocument}
                onParsed={applyParsedExpense}
              />
              <div className="relative flex-1">
                <input
                  type="text"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add note..."
                  className="w-full rounded-lg border-none bg-surface-container-low px-3 py-2.5 pr-11 text-base placeholder:text-secondary focus:ring-0 md:px-4 md:py-3 md:pr-12"
                />
                {note && (
                  <button
                    type="button"
                    onClick={() => setNote('')}
                    aria-label="Clear note"
                    title="Clear note"
                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container-high hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-base">
                      close
                    </span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving || isProcessingSharedDocument}
                aria-label={
                  isParsedTransactionPending
                    ? 'Confirm parsed transaction'
                    : 'Save expense'
                }
                title={
                  isParsedTransactionPending
                    ? 'Confirm parsed transaction'
                    : 'Save expense'
                }
                className={`flex h-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-all active:scale-95 disabled:opacity-50 md:h-12 ${
                  isParsedTransactionPending ? 'gap-1.5 px-3.5' : 'w-11 md:w-12'
                }`}
              >
                <span className="material-symbols-outlined font-bold">
                  check
                </span>
                {isParsedTransactionPending && (
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Confirm
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <nav className="hidden fixed left-0 top-0 h-full w-20 flex-col items-center gap-10 border-r border-surface-container-high bg-white py-8 md:flex">
        <div className="font-headline text-xl font-black tracking-tighter">
          S.
        </div>
        <div className="flex flex-col gap-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-secondary opacity-60"
          >
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

      {isProcessingSharedDocument && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-surface/85 px-6 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label="Parsing shared document"
        >
          <div className="flex max-w-xs flex-col items-center rounded-2xl bg-white px-8 py-7 text-center shadow-2xl ring-1 ring-outline-variant/30">
            <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-secondary/20 border-t-primary" />
            <p className="mt-4 font-headline text-sm font-black uppercase tracking-widest text-primary">
              Parsing document
            </p>
            <p className="mt-1 text-xs text-secondary">
              Extracting the transaction for your review…
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
