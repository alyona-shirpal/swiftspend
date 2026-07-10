import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Currency } from '@swiftspend/types';
import { MonthlyHero } from '../../components/dashboard/MonthlyHero';
import { InstantLogging } from '../../components/dashboard/InstantLogging';
import { RecentSpend } from '../../components/dashboard/RecentSpend';
import { AnimatedBrandText } from '../../components/layout/AnimatedBrandText';
import { BottomNavigation } from '../../components/layout/BottomNavigation';
import { useUserCurrencies } from '../../hooks/useUserCurrencies';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: userCurrencies } = useUserCurrencies();

  // Default to user's first currency (or EUR as fallback) — shared by hero + recent list
  const defaultCurrency =
    (userCurrencies?.currencies?.[0]?.currency as Currency) ?? Currency.EUR;

  const [selectedCurrency, setSelectedCurrency] =
    useState<Currency>(defaultCurrency);

  // Sync to user's default once loaded (only if not yet interacted)
  React.useEffect(() => {
    if (userCurrencies?.currencies?.[0]?.currency) {
      setSelectedCurrency(userCurrencies.currencies[0].currency as Currency);
    }
  }, [userCurrencies]);

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen pb-32">
      {/* TopAppBar */}
      <header className="bg-[#f7f9fb] flex justify-between items-center px-6 py-2 w-full docked full-width top-0 sticky z-40">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-black uppercase tracking-widest">
            <AnimatedBrandText />
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="p-2 -mr-2 rounded-full text-secondary hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 pt-3 pb-4 space-y-5">
        {/* Monthly hero — currency switcher lives here */}
        <MonthlyHero
          selectedCurrency={selectedCurrency}
          onCurrencyChange={setSelectedCurrency}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Instant Logging block */}
          <aside className="lg:col-span-5 order-1 lg:order-2">
            <InstantLogging />
          </aside>

          {/* Recent Spend — mirrors selected currency */}
          <RecentSpend currency={selectedCurrency} />
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};
