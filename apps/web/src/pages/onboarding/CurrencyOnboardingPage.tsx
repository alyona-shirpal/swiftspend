import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatedBrandText } from '../../components/layout/AnimatedBrandText';
import { useExchangeRates } from '../../hooks/useExchangeRates';
import {
  USER_CURRENCIES_QUERY_KEY,
  useUserCurrencies,
} from '../../hooks/useUserCurrencies';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { DEFAULT_CURRENCY } from '@swiftspend/types';

interface AvailableCurrency {
  code: string;
  name: string;
  symbol: string;
  isPopular: boolean;
}

const POPULAR_CODES = ['EUR', 'USD', 'UAH', 'ALL', 'GBP', 'PLN', 'CZK', 'CHF'];

export default function CurrencyOnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const { data: userCurrencies, isLoading: userCurrenciesLoading } =
    useUserCurrencies();
  const {
    data: ratesSnapshot,
    isLoading: ratesLoading,
    isError: ratesError,
    refetch: refetchRates,
  } = useExchangeRates();

  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Redirect if already onboarded or not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
    if (userCurrencies && !userCurrencies.needs_onboarding) {
      if (userCurrencies.needs_category_onboarding) {
        navigate('/onboarding/categories');
      } else {
        navigate('/');
      }
    }
  }, [user, authLoading, userCurrencies, navigate]);

  // Process currencies
  const availableCurrencies = useMemo(() => {
    if (!ratesSnapshot?.rates) return [];

    const codes = Object.keys(ratesSnapshot.rates);
    const result: AvailableCurrency[] = [];

    const displayNames = new Intl.DisplayNames(['en'], { type: 'currency' });

    codes.forEach((code) => {
      try {
        const name = displayNames.of(code);
        if (!name || name === code) throw new Error('Invalid name');

        const symbol =
          new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: code,
            currencyDisplay: 'symbol',
          })
            .formatToParts(1)
            .find((p) => p.type === 'currency')?.value || '';

        if (!symbol) throw new Error('Invalid symbol');

        result.push({
          code,
          name,
          symbol,
          isPopular: POPULAR_CODES.includes(code),
        });
      } catch (e) {
        console.warn(`Skipping unsupported currency code: ${code}`);
      }
    });

    // Sort: Popular first (in order), then alphabetical
    return result.sort((a, b) => {
      if (a.isPopular && b.isPopular) {
        return POPULAR_CODES.indexOf(a.code) - POPULAR_CODES.indexOf(b.code);
      }
      if (a.isPopular) return -1;
      if (b.isPopular) return 1;
      return a.code.localeCompare(b.code);
    });
  }, [ratesSnapshot]);

  const filteredCurrencies = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return availableCurrencies;
    return availableCurrencies.filter(
      (c) =>
        c.code.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query),
    );
  }, [availableCurrencies, searchQuery]);

  const popularCurrencies = useMemo(
    () => filteredCurrencies.filter((c) => c.isPopular),
    [filteredCurrencies],
  );
  const otherCurrencies = useMemo(
    () => filteredCurrencies.filter((c) => !c.isPopular),
    [filteredCurrencies],
  );

  const toggleCurrency = (code: string) => {
    setSelectedCodes((prev) => {
      const isSelected = prev.includes(code);
      const next = isSelected
        ? prev.filter((c) => c !== code)
        : [...prev, code];

      // Default currency rules
      if (next.length === 0) {
        setDefaultCurrency('');
      } else if (!isSelected && next.length === 1) {
        setDefaultCurrency(code);
      } else if (!isSelected && code === DEFAULT_CURRENCY) {
        setDefaultCurrency(DEFAULT_CURRENCY);
      } else if (isSelected && defaultCurrency === code) {
        const firstRemaining = next[0] || '';
        setDefaultCurrency(firstRemaining);
      } else if (!next.includes(defaultCurrency)) {
        // Fallback if somehow default is lost
        setDefaultCurrency(next[0] || '');
      }

      return next;
    });
  };

  const handleRemoveChip = (code: string) => {
    toggleCurrency(code);
  };

  const handleSubmit = async () => {
    if (selectedCodes.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await api.post('/user-currencies/onboarding', {
        currencies: selectedCodes,
        default_currency: defaultCurrency || selectedCodes[0],
      });
      await queryClient.invalidateQueries({
        queryKey: USER_CURRENCIES_QUERY_KEY,
      });
      // Navigate to /onboarding/categories (next onboarding step)
      navigate('/onboarding/categories');
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? (error as Error & { response?: { data?: { error?: string } } })
              .response?.data?.error || error.message
          : 'Something went wrong';
      setSubmitError(message);
      setIsSubmitting(false);
    }
  };

  if (authLoading || (user && userCurrenciesLoading) || ratesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (ratesError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <div className="flex flex-col items-center text-center max-w-xs">
          <span className="material-symbols-outlined text-[48px] text-outline mb-4">
            wifi_off
          </span>
          <h2 className="font-headline text-primary text-xl font-bold mb-2">
            Could not load currencies
          </h2>
          <p className="font-body text-secondary text-sm mb-8 leading-relaxed">
            We couldn't connect to the exchange rate service. Please check your
            connection and try again.
          </p>
          <button
            onClick={() => refetchRates()}
            className="w-full h-14 bg-surface-container-low text-primary border border-outline-variant font-headline font-bold text-[0.875rem] uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const isInvalidCurrencyError = submitError
    ?.toLowerCase()
    .includes('invalid currency');

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center relative overflow-x-hidden">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e0e3e5;
          border-radius: 10px;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .tonal-shift-bg-surface-container-low {
          background-color: var(--surface-container-low, #f2f4f6);
        }
      `}</style>

      {/* Background Decorations */}
      <div className="hidden lg:block fixed -bottom-20 -left-20 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="hidden lg:block fixed -top-20 -right-20 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Sticky Header */}
      <header className="tonal-shift-bg-surface-container-low flex justify-between items-center w-full px-6 py-3 sticky top-0 z-50">
        <div className="flex flex-col items-center mx-auto">
          <span className="font-headline font-bold text-2xl uppercase tracking-widest text-primary leading-tight">
            <AnimatedBrandText compact />
          </span>
          <div className="flex gap-1.5 mt-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <div className="w-2 h-2 rounded-full bg-surface-container-highest" />
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center w-full px-6 pt-2 pb-6 relative z-10">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-xl shadow-primary/5">
          {/* Search Input */}
          <div className="relative mb-4">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search currencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-surface-container-low border-none rounded-xl text-primary font-body text-sm focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-outline/60"
            />
          </div>

          {/* Chips Row */}
          {selectedCodes.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-1 no-scrollbar">
              {selectedCodes.map((code) => (
                <div
                  key={code}
                  className="flex-shrink-0 bg-primary text-on-primary px-3 py-1.5 rounded-full flex items-center gap-2 text-[0.75rem] font-medium"
                >
                  {code}
                  <button
                    onClick={() => handleRemoveChip(code)}
                    className="material-symbols-outlined text-[14px]"
                  >
                    close
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Currency List */}
          <div className="max-h-[490px] overflow-y-auto pr-2 custom-scrollbar">
            {popularCurrencies.length > 0 && (
              <>
                <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  POPULAR
                </h3>
                <div className="space-y-0.5 mb-2">
                  {popularCurrencies.map((c) => (
                    <label
                      key={c.code}
                      className={`flex items-center justify-between p-2 cursor-pointer transition-colors rounded-sm border-l-[3px] ${
                        selectedCodes.includes(c.code)
                          ? 'bg-surface-container-low border-primary hover:bg-surface-container-high'
                          : 'bg-transparent border-transparent hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-headline font-bold text-primary w-10 text-lg">
                          {c.code}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-[0.875rem] font-semibold text-primary leading-tight">
                            {c.name}
                          </span>
                          <span className="text-[0.6875rem] text-secondary font-medium">
                            {c.symbol}
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedCodes.includes(c.code)}
                        onChange={() => toggleCurrency(c.code)}
                        className="w-5 h-5 rounded-[4px] border-outline text-primary focus:ring-0 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </>
            )}

            {otherCurrencies.length > 0 && (
              <>
                <h3 className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  ALL CURRENCIES
                </h3>
                <div className="space-y-0.5">
                  {otherCurrencies.map((c) => (
                    <label
                      key={c.code}
                      className={`flex items-center justify-between p-2 cursor-pointer transition-colors rounded-sm border-l-[3px] ${
                        selectedCodes.includes(c.code)
                          ? 'bg-surface-container-low border-primary hover:bg-surface-container-high'
                          : 'bg-transparent border-transparent hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-headline font-bold text-primary w-10 text-lg">
                          {c.code}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-[0.875rem] font-semibold text-primary leading-tight">
                            {c.name}
                          </span>
                          <span className="text-[0.6875rem] text-secondary font-medium">
                            {c.symbol}
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedCodes.includes(c.code)}
                        onChange={() => toggleCurrency(c.code)}
                        className="w-5 h-5 rounded-[4px] border-outline text-primary focus:ring-0 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </>
            )}

            {filteredCurrencies.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="material-symbols-outlined text-[32px] text-outline-variant mb-2">
                  search_off
                </span>
                <p className="font-label text-sm text-secondary font-bold">
                  No currencies found
                </p>
                <p className="font-label text-[0.75rem] text-outline">
                  Try a different search term
                </p>
              </div>
            )}
          </div>

          {/* Default Currency Selector */}
          {selectedCodes.length > 0 && (
            <div className="mt-6 pt-4 border-t border-surface-container-high">
              <span className="font-label text-[0.6875rem] uppercase tracking-wider text-secondary mb-2 block font-black">
                Show all reports in
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedCodes.map((code) => (
                  <button
                    key={code}
                    onClick={() => setDefaultCurrency(code)}
                    className={`px-4 py-2 rounded-xl text-[0.875rem] font-bold border-2 transition-all ${
                      defaultCurrency === code
                        ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20'
                        : 'bg-surface-container-low text-secondary border-transparent hover:border-outline-variant'
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Action Cluster */}
      <footer className="w-full max-w-md px-6 pb-6 mt-auto">
        <div className="space-y-3">
          {submitError && (
            <div className="text-error text-[0.75rem] font-label text-center flex flex-col items-center gap-2 bg-error/5 p-3 rounded-lg border border-error/10">
              <span>
                {isInvalidCurrencyError
                  ? 'One or more selected currencies are no longer supported. Please refresh.'
                  : 'Something went wrong. Please try again.'}
              </span>
              {isInvalidCurrencyError && (
                <button
                  onClick={() => refetchRates()}
                  className="font-bold underline decoration-2 underline-offset-2"
                >
                  Refresh
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={selectedCodes.length === 0 || isSubmitting}
            className={`w-full h-14 bg-primary text-on-primary font-headline font-bold text-[0.875rem] uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 ${
              selectedCodes.length === 0 || isSubmitting
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:opacity-90 active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            ) : (
              <>
                GET STARTED
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </>
            )}
          </button>

          <div className="text-center">
            <span className="font-body text-[0.8125rem] text-secondary font-medium">
              Step 1 of 2
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
