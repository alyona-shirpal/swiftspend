import React from 'react';
import { QuickFilter } from '../../types/analytics';

interface AnalyticsSearchProps {
  searchQuery: string;
  activeQuickFilter: QuickFilter;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onQuickFilter: (filter: QuickFilter) => void;
  onClear: () => void;
}

const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: 'this-month', label: 'This Month' },
  { id: 'this-year', label: 'This Year' },
  { id: 'last-30-days', label: 'Last 30 Days' },
];

export const AnalyticsSearch: React.FC<AnalyticsSearchProps> = ({
  searchQuery,
  activeQuickFilter,
  onSearchChange,
  onSearchSubmit,
  onQuickFilter,
  onClear,
}) => {
  return (
    <section className="sticky top-16 z-50 bg-surface/80 backdrop-blur-md pb-4 -mx-6 px-6">
      <div className="relative flex items-center bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-1">
        <span className="material-symbols-outlined absolute left-4 text-outline">search</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearchSubmit();
            if (e.key === 'Backspace' && searchQuery === '') onClear();
          }}
          placeholder="Search category, date, or year..."
          className="w-full bg-transparent border-none focus:ring-0 pl-12 pr-4 py-3 text-sm font-body text-on-surface placeholder:text-outline"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 p-1 rounded-full text-outline hover:text-primary"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
        {QUICK_FILTERS.map((chip) => {
          const isActive = !searchQuery && activeQuickFilter === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onQuickFilter(chip.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#10B981] text-white font-bold shadow-lg shadow-[#10B981]/20'
                  : 'bg-surface-container-high text-secondary hover:bg-surface-container-highest'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};
