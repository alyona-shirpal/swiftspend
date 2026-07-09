import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Currency } from '@swiftspend/types';
import { AnalyticsSearch } from '../../components/analytics/AnalyticsSearch';
import { AnalyticsQuickStats } from '../../components/analytics/AnalyticsQuickStats';
import { AnalyticsCategoryBreakdown } from '../../components/analytics/AnalyticsCategoryBreakdown';
import { AnalyticsCategoryTrends } from '../../components/analytics/AnalyticsCategoryTrends';
import { AnalyticsTopMerchants } from '../../components/analytics/AnalyticsTopMerchants';
import { AnalyticsDensityCalendar } from '../../components/analytics/AnalyticsDensityCalendar';
import { BottomNavigation } from '../../components/layout/BottomNavigation';
import { useAnalyticsData } from '../../hooks/useAnalyticsData';
import { useDensityCalendar } from '../../hooks/useDensityCalendar';
import { useCategories } from '../../hooks/useCategories';
import { useUserCurrencies } from '../../hooks/useUserCurrencies';
import { ParsedSearch, QuickFilter } from '../../types/analytics';
import {
  getQuickFilterSearch,
  parseSearchInput,
} from '../../utils/parseSearchInput';
import {
  addMonths,
  canGoNext,
  canGoPrev,
  getCalendarBounds,
  getInitialCalendarMonth,
} from '../../utils/calendarBounds';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const { data: userCurrencies } = useUserCurrencies();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] =
    useState<QuickFilter>('this-month');
  const [activeSearch, setActiveSearch] = useState<ParsedSearch>(() =>
    getQuickFilterSearch('this-month'),
  );
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    Currency.EUR,
  );
  const [calendarView, setCalendarView] = useState(() =>
    getInitialCalendarMonth(getQuickFilterSearch('this-month')),
  );

  const currencyOptions = userCurrencies?.currencies?.map(
    (uc) => uc.currency as Currency,
  ) ?? [Currency.EUR];

  React.useEffect(() => {
    if (userCurrencies?.currencies?.[0]?.currency) {
      setSelectedCurrency(userCurrencies.currencies[0].currency as Currency);
    }
  }, [userCurrencies]);

  const { data, isLoading, isFetching, error, refetch } = useAnalyticsData(
    activeSearch,
    selectedCurrency,
    categories,
  );

  React.useEffect(() => {
    setCalendarView(getInitialCalendarMonth(activeSearch));
  }, [activeSearch]);

  const calendarBounds = useMemo(
    () => getCalendarBounds(activeSearch),
    [activeSearch],
  );
  const highlightDate =
    activeSearch.type === 'date' ? activeSearch.date : undefined;

  const {
    data: densityCalendar,
    isLoading: densityLoading,
    isFetching: densityFetching,
  } = useDensityCalendar(
    calendarView.year,
    calendarView.month,
    selectedCurrency,
    activeSearch.category?.id,
    highlightDate,
    categories,
  );

  const showLoading = isLoading || isFetching;
  const showDensityLoading = densityLoading || densityFetching;

  const handleSearchSubmit = () => {
    const parsed = parseSearchInput(searchQuery, categories);
    if (parsed) {
      setActiveSearch(parsed);
    }
  };

  const handleQuickFilter = (filter: QuickFilter) => {
    setSearchQuery('');
    setActiveQuickFilter(filter);
    setActiveSearch(getQuickFilterSearch(filter));
  };

  const handleClear = () => {
    setSearchQuery('');
    setActiveQuickFilter('this-month');
    setActiveSearch(getQuickFilterSearch('this-month'));
  };

  const displayLabel = useMemo(
    () => activeSearch?.label ?? 'This Month',
    [activeSearch],
  );

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <header className="fixed top-0 left-0 right-0 z-[60] bg-surface flex justify-between items-center w-full px-6 py-4">
        <button
          type="button"
          onClick={() => navigate('/reports/daily')}
          className="p-2 rounded-full hover:bg-surface-container-low/50 transition-colors"
        >
          <span className="material-symbols-outlined text-black">
            arrow_back
          </span>
        </button>
        <h1 className="font-display text-sm uppercase font-black tracking-tighter text-primary">
          Analytics
        </h1>
        <div className="flex rounded-lg bg-surface-container-low p-0.5">
          {currencyOptions.map((currency) => (
            <button
              key={currency}
              type="button"
              onClick={() => setSelectedCurrency(currency)}
              className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                selectedCurrency === currency
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-secondary'
              }`}
            >
              {currency}
            </button>
          ))}
        </div>
      </header>

      <main className="pt-16 px-6 space-y-8 max-w-2xl mx-auto">
        <AnalyticsSearch
          searchQuery={searchQuery}
          activeQuickFilter={activeQuickFilter}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          onQuickFilter={handleQuickFilter}
          onClear={handleClear}
        />

        {error && (
          <section className="bg-error-container/30 border border-error/20 rounded-xl p-4 text-center">
            <span className="material-symbols-outlined text-error mb-2">
              error
            </span>
            <p className="text-sm text-on-surface mb-3">
              Failed to load analytics data.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium"
            >
              Retry
            </button>
          </section>
        )}

        {!error && !showLoading && data && !data.hasData && (
          <section className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-secondary mb-4">
              search_off
            </span>
            <h2 className="text-lg font-bold text-primary mb-2">
              No expenses found for &ldquo;{displayLabel}&rdquo;
            </h2>
            <p className="text-sm text-secondary">
              Try a different search or quick filter.
            </p>
          </section>
        )}

        {(showLoading || data?.hasData) && (
          <>
            <AnalyticsQuickStats
              label={displayLabel}
              dailyAverage={data?.dailyAverage ?? 0}
              noSpendStreak={data?.noSpendStreak ?? 0}
              total={data?.total ?? 0}
              currency={selectedCurrency}
              isLoading={showLoading}
            />

            {(showLoading || data?.showCategoryBreakdown) && (
              <AnalyticsCategoryBreakdown
                categories={data?.categories ?? []}
                total={data?.total ?? 0}
                currency={selectedCurrency}
                isLoading={showLoading}
              />
            )}

            {(showLoading ||
              (data?.showTrends && (data?.trends?.length ?? 0) > 0)) && (
              <AnalyticsCategoryTrends
                trends={data?.trends ?? []}
                isLoading={showLoading}
              />
            )}

            <AnalyticsTopMerchants
              merchants={data?.merchants ?? []}
              currency={selectedCurrency}
              isLoading={showLoading}
            />
          </>
        )}

        <AnalyticsDensityCalendar
          calendar={densityCalendar}
          viewMonth={calendarView}
          canGoPrev={canGoPrev(calendarView, calendarBounds.min)}
          canGoNext={canGoNext(calendarView, calendarBounds.max)}
          onPrevMonth={() =>
            setCalendarView((v) => addMonths(v.year, v.month, -1))
          }
          onNextMonth={() =>
            setCalendarView((v) => addMonths(v.year, v.month, 1))
          }
          highlightDate={highlightDate}
          currency={selectedCurrency}
          isLoading={showDensityLoading}
        />
      </main>

      <BottomNavigation />
    </div>
  );
};
