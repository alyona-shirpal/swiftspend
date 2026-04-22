import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Currency, DEFAULT_CURRENCY } from '@swiftspend/types';

interface CurrencyState {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: DEFAULT_CURRENCY,
      setCurrency: (currency: Currency) => set({ currency }),
    }),
    {
      name: 'swiftspend-currency-storage',
    }
  )
);
