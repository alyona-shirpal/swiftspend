import React from 'react';
import { useNavigate } from 'react-router-dom';

export type ReportTab = 'daily' | 'monthly' | 'yearly' | 'analytics';

interface ReportPeriodNavProps {
  activePeriod: ReportTab;
}

export const REPORT_TABS: { id: ReportTab; label: string; path: string }[] = [
  { id: 'daily', label: 'Daily', path: '/reports/daily' },
  { id: 'monthly', label: 'Monthly', path: '/reports/monthly' },
  { id: 'yearly', label: 'Yearly', path: '/reports/yearly' },
  { id: 'analytics', label: 'Analytics', path: '/analytics' },
];

export const ReportPeriodNav: React.FC<ReportPeriodNavProps> = ({ activePeriod }) => {
  const navigate = useNavigate();

  return (
    <div className="pt-2 pb-4">
      <div className="bg-surface-container-low p-1 flex rounded-xl">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => navigate(tab.path)}
            className={`flex-1 py-2 text-xs sm:text-sm rounded-lg transition-all ${
              activePeriod === tab.id
                ? 'font-semibold bg-surface-container-lowest shadow-sm text-primary'
                : 'font-medium text-secondary hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
