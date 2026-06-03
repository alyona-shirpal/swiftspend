import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category } from '@swiftspend/types';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';

interface CategoryState extends Omit<Category, 'user_id' | 'created_at'> {
  is_hidden: boolean;
}

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  '#FF6B6B': { bg: 'bg-red-50', text: 'text-red-500' },
  '#4ECDC4': { bg: 'bg-emerald-50', text: 'text-emerald-500' },
  '#45B7D1': { bg: 'bg-sky-50', text: 'text-sky-500' },
  '#96CEB4': { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  '#FFEAA7': { bg: 'bg-amber-50', text: 'text-amber-500' },
  '#DDA0DD': { bg: 'bg-violet-50', text: 'text-violet-500' },
  '#F0E68C': { bg: 'bg-yellow-50', text: 'text-yellow-600' },
  '#98D8C8': { bg: 'bg-cyan-50', text: 'text-cyan-500' },
  '#FFB347': { bg: 'bg-orange-50', text: 'text-orange-500' },
  '#B0B0B0': { bg: 'bg-slate-50', text: 'text-slate-500' },
};

export const CategoriesSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState<CategoryState[]>([]);
  const [initialCategories, setInitialCategories] = useState<CategoryState[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [duplicateError, setDuplicateError] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get<Category[]>('/categories');
        const uniqueData = data.reduce((acc: Category[], current) => {
          const x = acc.find(item => item.name.toLowerCase() === current.name.toLowerCase());
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);

        const state = uniqueData.map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          is_system: c.is_system,
          is_hidden: c.is_hidden
        }));
        setCategories(state);
        setInitialCategories(JSON.parse(JSON.stringify(state)));
        setFetchError(false);
      } catch (err) {
        setFetchError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchCategories();
    }
  }, [user]);

  const visibleCount = categories.filter(c => !c.is_hidden).length;
  const totalCount = categories.length;

  const toggleVisibility = (id: string) => {
    setCategories(prev => prev.map(c => 
      c.id === id ? { ...c, is_hidden: !c.is_hidden } : c
    ));
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;

    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setDuplicateError(true);
      return;
    }

    setDuplicateError(false);
    setAddError(null);
    setIsAddingCategory(true);

    try {
      const { data } = await api.post<Category>('/categories', {
        name,
        icon: 'category',
        color: '#B0B0B0',
        is_system: false
      });
      const newCat: CategoryState = {
        id: data.id,
        name: data.name,
        icon: data.icon,
        color: data.color,
        is_system: data.is_system,
        is_hidden: data.is_hidden
      };
      setCategories(prev => [...prev, newCat]);
      setInitialCategories(prev => [...prev, newCat]); // New category already saved to db
      setNewCategoryName('');
      toast.success('Category added successfully');
    } catch (err) {
      setAddError('Could not add category. Please try again.');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleSaveAndBack = async () => {
    setIsSubmitting(true);

    const changedCategories = categories.filter(c => {
      const initial = initialCategories.find(i => i.id === c.id);
      return initial && initial.is_hidden !== c.is_hidden;
    });

    if (changedCategories.length === 0) {
      navigate('/settings');
      return;
    }

    const failedNames: string[] = [];
    await Promise.allSettled(
      changedCategories.map(async (c) => {
        try {
          await api.put(`/categories/${c.id}`, { is_hidden: c.is_hidden });
        } catch (err) {
          failedNames.push(c.name);
          throw err;
        }
      })
    );

    setIsSubmitting(false);

    if (failedNames.length > 0) {
      toast.error(`Could not update: ${failedNames.join(', ')}`);
    } else {
      toast.success('Changes saved successfully');
      navigate('/settings');
    }
  };

  const getColorClasses = (hex: string) => {
    return COLOR_MAP[hex] || { bg: 'bg-gray-50', text: 'text-gray-500' };
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body relative overflow-hidden">
      <style>{`
        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 0.75rem;
        }
        .fill-icon {
          font-variation-settings: 'FILL' 1;
        }
      `}</style>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f7f9fb] flex items-center justify-between px-6 py-4 border-b border-surface-container-low/30">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSaveAndBack}
            disabled={isSubmitting}
            className="p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-black">arrow_back</span>
          </button>
          <h1 className="text-xl font-extrabold font-headline tracking-tight text-black">Categories</h1>
        </div>
        {isSubmitting && (
           <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        )}
      </header>

      <main className="pt-24 pb-32 px-6 max-w-md mx-auto">
        <div className="mb-8">
          <p className="text-sm text-secondary font-medium">Toggle categories to hide the ones you don't need, or add new ones.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="material-symbols-outlined text-40 text-outline mb-4">cloud_off</span>
            <p className="text-primary font-bold mb-2">Could not load categories</p>
            <p className="text-sm text-secondary mb-6">Please check your connection and try again.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-surface-container-low text-primary px-6 py-2 rounded-full font-bold text-sm"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="category-grid mb-6">
              {categories.map(c => {
                const colors = getColorClasses(c.color);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleVisibility(c.id)}
                    className={`flex items-center justify-between gap-1 px-2.5 py-2 transition-all active:scale-95 group rounded-full border shadow-sm ${
                      c.is_hidden 
                        ? 'bg-surface-container-low opacity-50 border-dashed border-outline-variant' 
                        : 'bg-white border-surface-container hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center ${colors.bg}`}>
                        <span className={`material-symbols-outlined text-[14px] fill-icon ${colors.text}`}>{c.icon}</span>
                      </div>
                      <span className="text-[11px] font-bold text-primary truncate">{c.name}</span>
                    </div>
                    <span className={`material-symbols-outlined text-[14px] ${c.is_hidden ? 'text-outline-variant' : 'text-outline'}`}>
                      {c.is_hidden ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                );
              })}
            </div>

            {visibleCount === 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl mb-4 border border-red-100">
                <span className="material-symbols-outlined text-red-500 text-[20px]">warning</span>
                <p className="text-[0.75rem] text-red-700 font-label">
                  You've hidden all categories. You can still add expenses, but you won't be able to categorize them.
                </p>
              </div>
            )}

            <div className="flex justify-center py-2 mb-8">
              <span className="text-[0.8125rem] font-medium text-secondary">
                {visibleCount} of {totalCount} categories visible
              </span>
            </div>

            <div className="mt-4 border-t border-surface-container-low pt-6">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input 
                    type="text"
                    placeholder="Enter new category name..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    className="w-full bg-surface-container-lowest border border-surface-container rounded-lg h-12 focus:ring-1 focus:ring-primary focus:border-primary text-sm font-medium text-primary px-4 placeholder:text-outline-variant transition-all"
                  />
                </div>
                <button 
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim() || isAddingCategory}
                  className="h-12 bg-primary text-on-primary px-6 rounded-lg font-bold text-xs tracking-widest uppercase hover:opacity-90 active:scale-95 transition-all flex items-center justify-center shrink-0 disabled:opacity-40"
                >
                  {isAddingCategory ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Add'}
                </button>
              </div>
              {duplicateError && (
                <p className="text-error text-[0.75rem] font-label mt-2">A category with this name already exists</p>
              )}
              {addError && (
                <p className="text-error text-[0.75rem] font-label mt-2">{addError}</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
