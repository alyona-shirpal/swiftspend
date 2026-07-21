import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Currency } from '@swiftspend/types';
import { MonthlyHero } from '../../components/dashboard/MonthlyHero';
import { InstantLogging } from '../../components/dashboard/InstantLogging';
import { RecentSpend } from '../../components/dashboard/RecentSpend';
import { AnimatedBrandText } from '../../components/layout/AnimatedBrandText';
import { AppLayout, HeaderIconButton } from '../../components/layout/AppLayout';
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
    <AppLayout
      title={
        <h1 className="text-xl font-black uppercase tracking-widest text-black">
          <AnimatedBrandText />
        </h1>
      }
      actions={
        <HeaderIconButton
          icon="settings"
          label="Settings"
          onClick={() => navigate('/settings')}
        />
      }
      width="full"
      mainClassName="space-y-5"
    >
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
    </AppLayout>
  );
};
