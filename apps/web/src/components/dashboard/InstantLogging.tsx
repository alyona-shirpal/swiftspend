import React, { useState, useEffect } from 'react';
import { Currency } from '@swiftspend/types';
import { useRecentCategories } from '../../hooks/useRecentCategories';
import { useAddExpense } from '../../hooks/useAddExpense';
import { CategoryPill } from './CategoryPill';
import { Category } from '../../types/api';
import toast from 'react-hot-toast';

// Default categories shown when the user hasn't used any yet
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'default-food',        name: 'Food',        icon: 'restaurant',      color: '#FF6B35' },
  { id: 'default-restaurants', name: 'Restaurants', icon: 'storefront',      color: '#9B59B6' },
  { id: 'default-beauty',      name: 'Beauty',      icon: 'spa',             color: '#E91E8C' },
  { id: 'default-home',        name: 'Home',        icon: 'home',            color: '#2196F3' },
];

export const InstantLogging: React.FC = () => {
  const [amountStr, setAmountStr] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>(Currency.EUR);
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const { data: recentCategories } = useRecentCategories();
  const { mutate: addExpense, isPending, error: submitError } = useAddExpense();

  const hasRecentCategories = recentCategories && recentCategories.length > 0;
  const displayCategories: Category[] = hasRecentCategories ? recentCategories : DEFAULT_CATEGORIES;
  const categoryLabel = hasRecentCategories ? 'Recent Categories' : 'Categories';

  // Auto-select first category when list loads
  useEffect(() => {
    if (displayCategories.length > 0 && !categoryId) {
      setCategoryId(displayCategories[0]!.id);
    }
  }, [displayCategories, categoryId]);

  const amount = parseFloat(amountStr) || 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || Number(val) >= 0) {
      setAmountStr(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || amount <= 0) {
      toast.error('Enter an amount greater than 0');
      return;
    }

    // Don't send default placeholder category IDs to the API
    const isDefaultCategory = categoryId.startsWith('default-');

    addExpense(
      {
        amount,
        currency,
        category_id: isDefaultCategory || !categoryId ? undefined : categoryId,
        description: description || undefined,
      },
      {
        onSuccess: () => {
          setAmountStr('');
          setDescription('');
          toast.success('Expense added', {
            style: { background: '#009668', color: '#ffffff' },
          });
        },
        onError: () => {
          toast.error('Something went wrong. Try again.');
        },
      }
    );
  };

  return (
    <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-xl sticky top-24 shadow-sm border border-outline-variant/10 p-6">
      <h3 className="font-headline text-xl font-bold text-primary dark:text-white mb-6">
        Instant Logging
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount + Currency Row */}
        <div>
          <div className="flex items-center border-b-2 border-surface-container-highest focus-within:border-on-tertiary-container transition-colors py-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              disabled={isPending}
              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-secondary uppercase tracking-widest cursor-pointer pl-0 pr-6 py-0 appearance-none"
            >
              <option value="ALL">ALL</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="UAH">UAH</option>
            </select>
            <input
              type="number"
              placeholder="0"
              step="any"
              min="0"
              value={amountStr}
              onChange={handleAmountChange}
              disabled={isPending}
              className="w-full bg-transparent border-none focus:ring-0 text-3xl font-headline font-bold text-primary dark:text-white"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <label className="font-label text-xs font-bold text-secondary uppercase tracking-widest block">
            {categoryLabel}
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

        {/* Description */}
        <div>
          <input
            type="text"
            placeholder="What was this for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isPending}
            className="w-full bg-transparent border-b-2 border-surface-container-highest focus:border-on-tertiary-container focus:outline-none focus:ring-0 transition-colors py-3 font-body font-medium text-on-surface placeholder:text-secondary/50"
          />
        </div>

        {submitError && (
          <p className="text-error text-xs font-medium">{submitError.message || 'Something went wrong.'}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary dark:bg-white text-on-primary dark:text-black py-5 rounded-md font-label font-black uppercase tracking-[0.2em] shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Add'}
        </button>
      </form>
    </div>
  );
};
