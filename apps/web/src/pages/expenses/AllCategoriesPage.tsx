import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCreateCategory } from '../../hooks/useCreateCategory';
import { useCategories } from '../../hooks/useCategories';
import { AppLayout } from '../../components/layout/AppLayout';
import type { Category } from '../../types/api';

const CATEGORY_DRAFT_KEY = 'swiftspend.add-expense.selected-category';

export const AllCategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const { mutateAsync: createCategory, isPending } = useCreateCategory();
  const { data: categories = [] } = useCategories();
  const [customName, setCustomName] = useState('');

  const selectedCategoryId = sessionStorage.getItem(CATEGORY_DRAFT_KEY);

  const handleSelect = (category: Category) => {
    sessionStorage.setItem(CATEGORY_DRAFT_KEY, category.id);
    navigate('/expenses/new');
  };

  const handleCreate = async () => {
    const trimmed = customName.trim();
    if (!trimmed) {
      toast.error('Enter a category name first.');
      return;
    }

    try {
      const created = await createCategory({
        name: trimmed,
        icon: 'category',
        color: '#111827',
      });
      setCustomName('');
      sessionStorage.setItem(CATEGORY_DRAFT_KEY, created.id);
      toast.success('Category created');
    } catch {
      toast.error('Could not create category.');
    }
  };

  return (
    <AppLayout title="Select Category" backTo="/expenses/new" width="3xl">
        <section>
          <p className="mb-4 font-label text-[10px] font-medium uppercase tracking-wide text-secondary">
            All Categories
          </p>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {categories.map((category) => {
              const isSelected = category.id === selectedCategoryId;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleSelect(category)}
                  className={`aspect-square rounded-lg border-2 transition-all hover:bg-surface-container-low active:scale-95 ${
                    isSelected 
                      ? 'border-primary shadow-lg bg-white' 
                      : 'border-transparent bg-surface-container-lowest'
                  }`}
                >
                  <div className="flex h-full flex-col items-center justify-center gap-2">
                    <span className={`material-symbols-outlined transition-colors ${
                      isSelected 
                        ? 'text-primary' 
                        : 'text-secondary hover:text-primary'
                    }`}>
                      {category.icon}
                    </span>
                    <span className={`px-1 text-center font-label text-[10px] font-semibold uppercase tracking-tighter ${
                      isSelected 
                        ? 'text-primary' 
                        : ''
                    }`}>
                      {category.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-12 space-y-4 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-6">
          <div>
            <label
              htmlFor="category-name"
              className="mb-2 block font-label text-[10px] font-medium uppercase tracking-wide text-secondary"
            >
              Category Name
            </label>
            <input
              id="category-name"
              type="text"
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder={customName ? '' : 'e.g. Shopping, Hobbies'}
              className="h-12 w-full rounded-lg border-outline-variant bg-surface px-4 text-sm font-medium transition-all focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={isPending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary font-headline font-bold text-on-primary transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            {isPending ? 'Creating...' : 'Create Category'}
          </button>
      </section>

      <div className="pointer-events-none fixed right-0 top-0 -z-10 h-64 w-64 rounded-full bg-secondary/5 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-on-tertiary-container/5 blur-[120px]" />
    </AppLayout>
  );
};
