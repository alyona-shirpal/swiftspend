import React, { useMemo, useState, useEffect } from 'react';
import { Currency } from '@swiftspend/types';
import { useRecentCategories } from '../../hooks/useRecentCategories';
import { useCategories } from '../../hooks/useCategories';
import { useAddExpense } from '../../hooks/useAddExpense';
import { useExpenseNoteSuggestions } from '../../hooks/useExpenseNoteSuggestions';
import { useExpenseMerchantSuggestions } from '../../hooks/useExpenseMerchantSuggestions';
import { CategoryPill } from './CategoryPill';
import { Category } from '../../types/api';
import toast from 'react-hot-toast';
import { sortCategoriesByLastUsed } from '../../utils/categorySorting';
import { ExpenseDocumentUpload } from '../expenses/ExpenseDocumentUpload';

const CURRENCIES: Currency[] = [Currency.ALL, Currency.EUR, Currency.USD, Currency.UAH];

interface SuggestionChip {
  key: string;
  label: string;
  count: number;
}

const SuggestionChips: React.FC<{
  suggestions: SuggestionChip[];
  disabled: boolean;
  onPick: (label: string) => void;
}> = ({ suggestions, disabled, onPick }) => (
  <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
    {suggestions.map((suggestion) => (
      <button
        key={suggestion.key}
        type="button"
        onClick={() => onPick(suggestion.label)}
        disabled={disabled}
        title={suggestion.label}
        className="flex max-w-[11rem] shrink-0 items-center gap-1.5 rounded-full border border-outline-variant/30 bg-surface-container-lowest px-2.5 py-1 text-left text-xs font-semibold text-secondary transition-all hover:border-on-tertiary-container/40 hover:text-primary active:scale-[0.98] disabled:opacity-50"
      >
        <span className="min-w-0 truncate">{suggestion.label}</span>
        {suggestion.count > 1 && (
          <span className="rounded-full bg-on-tertiary-container/10 px-1.5 py-0.5 text-[10px] font-bold leading-none text-on-tertiary-container">
            {suggestion.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

export const InstantLogging: React.FC = () => {
  const [amountStr, setAmountStr] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>(Currency.ALL);
  const [categoryId, setCategoryId] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: recentCategories, refetch: refetchRecent } = useRecentCategories();
  const { data: allCategories, refetch: refetchAll } = useCategories();
  const { mutateAsync: addExpense } = useAddExpense();
  const normalizedDescription = description.trim().toLowerCase();
  const { data: noteSuggestions = [] } = useExpenseNoteSuggestions(categoryId, description);
  const visibleNoteSuggestions = noteSuggestions
    .filter((suggestion) => suggestion.normalized_note !== normalizedDescription)
    .slice(0, 5);
  const normalizedMerchant = merchant.trim().toLowerCase();
  const { data: merchantSuggestions = [] } = useExpenseMerchantSuggestions(
    categoryId,
    merchant,
  );
  const visibleMerchantSuggestions = merchantSuggestions
    .filter(
      (suggestion) => suggestion.normalized_merchant !== normalizedMerchant,
    )
    .slice(0, 5);

  // All categories to show: real recent ones take priority, else show all from DB
  // Remove duplicates by ensuring unique IDs
  const uniqueCategories = useMemo(
    () => (allCategories || []).filter((category, index, arr) =>
      arr.findIndex(c => c.id === category.id) === index
    ),
    [allCategories]
  );

  const displayCategories: Category[] = useMemo(() => {
    const recent = sortCategoriesByLastUsed(recentCategories || []);
    const fallback = sortCategoriesByLastUsed(uniqueCategories).filter(
      (category) => !recent.some((recentCategory) => recentCategory.id === category.id)
    );

    return [...recent, ...fallback];
  }, [recentCategories, uniqueCategories]);

  // Auto-select first option
  useEffect(() => {
    if (displayCategories.length > 0 && !categoryId) {
      setCategoryId(displayCategories[0]!.id);
    }
  }, [displayCategories, categoryId]);

  const amount = parseFloat(amountStr) || 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || Number(val) >= 0) setAmountStr(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || amount <= 0) {
      toast.error('Enter an amount greater than 0');
      return;
    }

    setIsSaving(true);
    try {
      await addExpense({
        amount,
        currency,
        category_id: categoryId || undefined,
        merchant: merchant.trim() || undefined,
        description: description || undefined,
      });

      // Refresh data
      await Promise.all([refetchRecent(), refetchAll()]);

      setAmountStr('');
      setMerchant('');
      setDescription('');
      toast.success('Expense added', {
        style: { background: '#009668', color: '#ffffff' },
      });
    } catch {
      toast.error('Something went wrong. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="sticky top-20 overflow-hidden rounded-[1.25rem] border border-outline-variant/20 bg-surface-container-lowest shadow-[0_12px_32px_-16px_rgba(16,27,48,0.25)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant/15 bg-gradient-to-r from-surface-container-low to-surface-container-lowest px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tertiary-fixed/40 text-on-tertiary-fixed-variant">
            <span className="material-symbols-outlined text-xl">bolt</span>
          </span>
          <div className="min-w-0">
            <h3 className="font-headline text-base font-extrabold leading-tight text-primary">
              Instant Logging
            </h3>
            <p className="truncate font-body text-xs font-medium text-secondary">
              Log it before you forget it
            </p>
          </div>
        </div>
        <ExpenseDocumentUpload
          autoCreate
          disabled={isSaving}
          onExpenseCreated={() => Promise.all([refetchRecent(), refetchAll()]).then(() => undefined)}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-5">
        {/* Amount + Currency */}
        <div className="rounded-xl bg-surface-container-low p-4 transition-shadow focus-within:ring-2 focus-within:ring-on-tertiary-container/30">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="instant-logging-amount"
              className="font-label text-[11px] font-bold uppercase tracking-widest text-secondary"
            >
              Amount
            </label>
            <div className="flex rounded-full bg-surface-container-high p-0.5">
              {CURRENCIES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCurrency(code)}
                  disabled={isSaving}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide transition-all disabled:opacity-50 ${
                    currency === code
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
          <input
            id="instant-logging-amount"
            type="number"
            inputMode="decimal"
            placeholder="0"
            step="any"
            min="0"
            value={amountStr}
            onChange={handleAmountChange}
            disabled={isSaving}
            className="w-full border-none bg-transparent p-0 font-headline text-4xl font-extrabold text-primary [appearance:textfield] placeholder:text-secondary/30 focus:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <label className="block font-label text-[11px] font-bold uppercase tracking-widest text-secondary">
            Category
          </label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {displayCategories.map((cat) => (
              <CategoryPill
                key={cat.id}
                category={cat}
                isSelected={cat.id === categoryId}
                onClick={() => setCategoryId(cat.id)}
              />
            ))}
          </div>
        </div>

        {/* Place */}
        <div className="space-y-2">
          {!!visibleMerchantSuggestions.length && (
            <SuggestionChips
              suggestions={visibleMerchantSuggestions.map((suggestion) => ({
                key: suggestion.normalized_merchant,
                label: suggestion.merchant,
                count: suggestion.count,
              }))}
              disabled={isSaving}
              onPick={setMerchant}
            />
          )}
          <div className="flex items-center gap-2.5 rounded-xl border border-transparent bg-surface-container-low px-3.5 transition-all focus-within:border-on-tertiary-container/40 focus-within:bg-surface-container-lowest focus-within:shadow-sm">
            <span className="material-symbols-outlined shrink-0 text-lg text-secondary">
              storefront
            </span>
            <input
              type="text"
              placeholder="Where was this?"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              disabled={isSaving}
              maxLength={120}
              className="w-full border-none bg-transparent px-0 py-3 font-body text-sm font-medium text-on-surface placeholder:text-secondary/50 focus:ring-0"
            />
            {merchant && (
              <button
                type="button"
                onClick={() => setMerchant('')}
                disabled={isSaving}
                aria-label="Clear place"
                title="Clear place"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container-high hover:text-primary disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          {!!visibleNoteSuggestions.length && (
            <SuggestionChips
              suggestions={visibleNoteSuggestions.map((suggestion) => ({
                key: suggestion.normalized_note,
                label: suggestion.note,
                count: suggestion.count,
              }))}
              disabled={isSaving}
              onPick={setDescription}
            />
          )}
          <div className="flex items-center gap-2.5 rounded-xl border border-transparent bg-surface-container-low px-3.5 transition-all focus-within:border-on-tertiary-container/40 focus-within:bg-surface-container-lowest focus-within:shadow-sm">
            <span className="material-symbols-outlined shrink-0 text-lg text-secondary">
              notes
            </span>
            <input
              type="text"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              className="w-full border-none bg-transparent px-0 py-3 font-body text-sm font-medium text-on-surface placeholder:text-secondary/50 focus:ring-0"
            />
            {description && (
              <button
                type="button"
                onClick={() => setDescription('')}
                disabled={isSaving}
                aria-label="Clear note"
                title="Clear note"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container-high hover:text-primary disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-label text-sm font-black uppercase tracking-[0.2em] text-on-primary shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:scale-[0.98] disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none"
        >
          {isSaving ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/30 border-t-on-primary" />
              Saving…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">add_circle</span>
              Add expense
            </>
          )}
        </button>
      </form>
    </div>
  );
};
