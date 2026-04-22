import { create } from 'zustand';
import { Currency } from '@swiftspend/types';

interface FilterState {
  dateFrom?: string;
  dateTo?: string;
  categories: string[];
  currencies: Currency[];
  search: string;
  setFilters: (filters: Partial<Omit<FilterState, 'setFilters' | 'clearFilters'>>) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  categories: [],
  currencies: [],
  search: '',
  setFilters: (filters) => set((state) => ({ ...state, ...filters })),
  clearFilters: () => set({
    dateFrom: undefined,
    dateTo: undefined,
    categories: [],
    currencies: [],
    search: ''
  })
}));
