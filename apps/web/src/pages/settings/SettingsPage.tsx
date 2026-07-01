import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { supabase } from '../../services/supabase.ts';
import { useExchangeRates } from '../../hooks/useExchangeRates';

// --- Types ---
interface Currency {
  id: string;
  currency: string;
  is_default: boolean;
  position: number;
}

// --- Sortable Item Component ---
const SortableCurrencyItem = ({ currency, onSetDefault }: { currency: Currency, onSetDefault: (code: string) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: currency.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between py-4 bg-surface-container-lowest"
    >
      <div className="flex items-center gap-4">
        <button
          className="p-1 cursor-grab active:cursor-grabbing text-on-surface-variant hover:text-primary transition-colors"
          {...attributes}
          {...listeners}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>
        <div>
          <span className="font-body font-semibold text-sm text-primary uppercase tracking-wider">{currency.currency}</span>
        </div>
      </div>
      
      {currency.is_default ? (
        <span className="font-label text-[10px] font-bold tracking-widest text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-sm uppercase">
          Default
        </span>
      ) : (
        <button
          onClick={() => onSetDefault(currency.currency)}
          className="font-label text-xs font-semibold text-secondary hover:text-primary transition-colors"
        >
          Set default
        </button>
      )}
    </div>
  );
};

// --- Main Page Component ---
export const SettingsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [passwordPrompt, setPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  
  // Add Currency Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState('');
  
  // Local Preferences State
  const [defaultReportView, setDefaultReportView] = useState(() => localStorage.getItem('pref_report_view') || 'Monthly');
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(() => localStorage.getItem('pref_first_day') || 'Monday');

  // Handle local preference changes
  const handleReportViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDefaultReportView(val);
    localStorage.setItem('pref_report_view', val);
    toast.success('Preference saved');
  };

  const handleFirstDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFirstDayOfWeek(val);
    localStorage.setItem('pref_first_day', val);
    toast.success('Preference saved');
  };

  // --- Fetch Data ---
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      return user;
    },
  });

  const { data: currenciesData, isLoading: isCurrenciesLoading } = useQuery({
    queryKey: ['userCurrencies'],
    queryFn: async () => {
      const res = await api.get('/user-currencies');
      return res.data;
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    },
  });

  const { data: ratesSnapshot } = useExchangeRates();

  const activeCategoriesCount = categoriesData?.filter((c: { is_hidden: boolean }) => !c.is_hidden).length || 0;

  // --- Add Currency Logic ---
  const availableCurrenciesToAdd = useMemo(() => {
    if (!ratesSnapshot?.rates) return [];
    const codes = Object.keys(ratesSnapshot.rates);
    const existingCodes = (currenciesData?.currencies || []).map((c: Currency) => c.currency);
    const filteredCodes = codes.filter(c => !existingCodes.includes(c));

    if (!addSearchQuery) return filteredCodes;
    const query = addSearchQuery.toLowerCase();
    const displayNames = new Intl.DisplayNames(['en'], { type: 'currency' });

    return filteredCodes.filter(c => {
      let name = '';
      try { name = displayNames.of(c) || ''; } catch { /* ignore */ }
      return c.toLowerCase().includes(query) || name.toLowerCase().includes(query);
    });
  }, [ratesSnapshot, currenciesData, addSearchQuery]);

  const addCurrencyMutation = useMutation({
    mutationFn: (code: string) => api.post('/user-currencies', { currency: code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCurrencies'] });
      setIsAddModalOpen(false);
      setAddSearchQuery('');
      toast.success('Currency added successfully');
    },
    onError: (err: unknown) => {
      const errorMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to add currency';
      toast.error(errorMsg);
    },
  });

  // --- Mutations ---
  const setDefaultCurrencyMutation = useMutation({
    mutationFn: (currencyCode: string) => api.put(`/user-currencies/${currencyCode}/default`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCurrencies'] });
      toast.success('Default currency updated');
    },
    onError: () => toast.error('Failed to update default currency'),
  });

  const updateCurrencyPositionMutation = useMutation({
    mutationFn: ({ code, position }: { code: string, position: number }) => 
      api.put(`/user-currencies/${code}/position`, { position }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userCurrencies'] }),
    onError: () => toast.error('Failed to save currency order'),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (pwd: string) => api.delete('/auth/user', { data: { password: pwd } }),
    onSuccess: async () => {
      await supabase.auth.signOut();
      toast.success('Account deleted successfully');
      navigate('/login');
    },
    onError: (err: unknown) => {
      const errorMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to delete account';
      toast.error(errorMsg);
      setPasswordPrompt(false);
      setPassword('');
    },
  });

  const signOut = async () => {
    if (window.confirm("You will be signed out of your account.")) {
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  // --- DnD Handlers ---
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [items, setItems] = useState<Currency[]>([]);

  useEffect(() => {
    if (currenciesData?.currencies) {
      setItems(currenciesData.currencies);
    }
  }, [currenciesData]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      
      // Send to backend
      const movedCurrency = items[oldIndex]?.currency;
      if (movedCurrency) {
        updateCurrencyPositionMutation.mutate({ code: movedCurrency, position: newIndex });
      }
    }
  };

  if (isProfileLoading || isCurrenciesLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f7f9fb] flex items-center w-full px-6 py-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full hover:bg-surface-container-low/50 transition-colors"
          >
            <span className="material-symbols-outlined text-black">arrow_back</span>
          </button>
          <h1 className="text-xl font-extrabold font-headline tracking-tight text-black">Settings</h1>
        </div>
      </header>

      <main className="pt-20 px-5 space-y-5">
        {/* Profile Section */}
        <section className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-display text-xl">
                {profile?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-body font-semibold text-title-md text-primary">{profile?.user_metadata?.full_name || 'User'}</h2>
                <p className="font-body text-body-md text-on-surface-variant">{profile?.email}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/settings/profile')}
              className="px-4 py-2 bg-surface-container-low hover:bg-surface-container-high transition-colors text-primary font-body text-sm font-semibold rounded-lg"
            >
              Edit
            </button>
          </div>
        </section>

        {/* Currencies Section */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <h3 className="font-display font-medium text-headline-sm text-primary">Currencies</h3>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="font-label text-xs font-semibold text-primary hover:underline uppercase tracking-wider"
            >
              + Add
            </button>
          </div>
          <div className="bg-surface-container-lowest px-6 rounded-xl shadow-sm border border-outline-variant/10">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={items.map(i => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y divide-surface-container-low">
                  {items.map((currency) => (
                    <SortableCurrencyItem 
                      key={currency.id} 
                      currency={currency} 
                      onSetDefault={(code) => setDefaultCurrencyMutation.mutate(code)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </section>

        {/* Categories Section */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <h3 className="font-display font-medium text-headline-sm text-primary">Categories</h3>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 flex items-center justify-between">
            <div>
              <p className="font-body text-title-md text-primary">{activeCategoriesCount} Active Categories</p>
              <p className="font-body text-body-sm text-on-surface-variant">Customize your spending labels</p>
            </div>
            <button
              onClick={() => navigate('/settings/categories')}
              className="px-4 py-2 bg-surface-container-low hover:bg-surface-container-high transition-colors text-primary font-body text-sm font-semibold rounded-lg"
            >
              Manage
            </button>
          </div>
        </section>

        {/* Preferences Section */}
        <section>
          <h3 className="font-display font-medium text-headline-sm text-primary mb-4">App Preferences</h3>
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 divide-y divide-surface-container-low">
            <div className="p-4 flex items-center justify-between">
              <label className="font-body text-title-md text-primary">Default Report View</label>
              <select
                value={defaultReportView}
                onChange={handleReportViewChange}
                className="bg-transparent border-none text-secondary font-body text-sm focus:ring-0 cursor-pointer pr-8"
              >
                <option value="Daily">Daily</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
            <div className="p-4 flex items-center justify-between">
              <label className="font-body text-title-md text-primary">First Day of Week</label>
              <select
                value={firstDayOfWeek}
                onChange={handleFirstDayChange}
                className="bg-transparent border-none text-secondary font-body text-sm focus:ring-0 cursor-pointer pr-8"
              >
                <option value="Monday">Monday</option>
                <option value="Sunday">Sunday</option>
              </select>
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="pt-4">
          <h3 className="font-display font-medium text-headline-sm text-error mb-4">Danger Zone</h3>
          <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-error-container/50 space-y-3">
            <button
              onClick={signOut}
              className="w-full py-4 text-center font-body text-sm font-semibold text-primary bg-surface-container-low hover:bg-surface-container-high rounded-lg transition-colors"
            >
              Sign Out
            </button>

            {passwordPrompt ? (
              <div className="pt-4 border-t border-error-container/30 space-y-4 animate-in fade-in slide-in-from-top-2">
                <p className="font-body text-sm text-error text-center">
                  This will permanently delete your account and all data. Enter your password to confirm.
                </p>
                <input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-high border-none rounded-lg p-3 text-primary placeholder:text-on-surface-variant focus:ring-1 focus:ring-error"
                />
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setPasswordPrompt(false);
                      setPassword('');
                    }}
                    className="py-3 font-body text-sm font-semibold text-primary bg-surface-container-low rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!password || deleteAccountMutation.isPending}
                    onClick={() => deleteAccountMutation.mutate(password)}
                    className="py-3 font-body text-sm font-semibold text-on-error bg-error rounded-lg disabled:opacity-50"
                  >
                    {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setPasswordPrompt(true)}
                className="w-full py-4 text-center font-body text-sm font-semibold text-error hover:bg-error-container/20 rounded-lg transition-colors border border-error/20"
              >
                Delete Account
              </button>
            )}
          </div>
        </section>
      </main>

      {/* Add Currency Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-surface-variant/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-xl text-primary">Add Currency</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-primary">
                close
              </button>
            </div>
            
            <div className="relative mb-4 shrink-0">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
              <input 
                type="text" 
                placeholder="Search currencies..."
                value={addSearchQuery}
                onChange={(e) => setAddSearchQuery(e.target.value)}
                className="w-full h-12 pl-11 pr-4 bg-surface-container-low border-none rounded-xl text-primary font-body text-sm focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-outline/60"
              />
            </div>

            <div className="overflow-y-auto pr-2 divide-y divide-surface-container-low flex-1 custom-scrollbar">
              {availableCurrenciesToAdd.length === 0 ? (
                <div className="py-8 text-center text-secondary font-label text-sm">No currencies found</div>
              ) : (
                availableCurrenciesToAdd.map(code => {
                  let name = code;
                  try { name = new Intl.DisplayNames(['en'], { type: 'currency' }).of(code) || code; } catch { /* ignore */ }
                  return (
                    <div key={code} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-headline font-bold text-primary w-10">{code}</span>
                        <span className="font-body text-sm text-secondary">{name}</span>
                      </div>
                      <button
                        onClick={() => addCurrencyMutation.mutate(code)}
                        disabled={addCurrencyMutation.isPending}
                        className="px-4 py-2 bg-surface-container-high hover:bg-primary hover:text-on-primary transition-colors text-primary font-body text-xs font-semibold rounded-lg disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
