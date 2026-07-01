import React, { useState, useEffect } from 'react';
import { Currency } from '@swiftspend/types';
import { useRecentCategories } from '../../hooks/useRecentCategories';
import { useCategories } from '../../hooks/useCategories';
import { useAddExpense } from '../../hooks/useAddExpense';
import { CategoryPill } from './CategoryPill';
import { Category } from '../../types/api';
import toast from 'react-hot-toast';

export const InstantLogging: React.FC = () => {
  const [amountStr, setAmountStr] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>(Currency.ALL);
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: recentCategories, refetch: refetchRecent } = useRecentCategories();
  const { data: allCategories, refetch: refetchAll } = useCategories();
  const { mutateAsync: addExpense } = useAddExpense();

  const hasRecentCategories = recentCategories && recentCategories.length > 0;

  // All categories to show: real recent ones take priority, else show all from DB
  // Remove duplicates by ensuring unique IDs
  const uniqueCategories = (allCategories || []).filter((category, index, arr) => 
    arr.findIndex(c => c.id === category.id) === index
  );
  
  const displayCategories: Category[] = hasRecentCategories
    ? recentCategories
    : uniqueCategories.slice(0, 10); // Show up to 10 if no recent ones

  const categoryLabel = hasRecentCategories ? 'Recent Categories' : 'Categories';

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
        description: description || undefined,
      });

      // Refresh data
      await Promise.all([refetchRecent(), refetchAll()]);

      setAmountStr('');
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
    <div className="bg-surface-container-lowest rounded-xl sticky top-20 shadow-sm border border-outline-variant/10 p-4">
      <h3 className="font-headline text-lg font-bold text-primary mb-3">
        Instant Logging
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount + Currency Row */}
        <div>
          <div className="flex items-center border-b-2 border-surface-container-highest focus-within:border-on-tertiary-container transition-colors py-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              disabled={isSaving}
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
              disabled={isSaving}
              className="w-full bg-transparent border-none focus:ring-0 text-3xl font-headline font-bold text-primary"
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
            disabled={isSaving}
            className="w-full bg-transparent border-b-2 border-surface-container-highest focus:border-on-tertiary-container focus:outline-none focus:ring-0 transition-colors py-3 font-body font-medium text-on-surface placeholder:text-secondary/50"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-primary text-on-primary py-3 rounded-md font-label font-black uppercase tracking-[0.2em] shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Add'}
        </button>
      </form>
    </div>
  );
};
