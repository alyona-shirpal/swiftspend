import React from 'react';
import { useNavigate } from 'react-router-dom';

type ReportPeriod = 'daily' | 'monthly' | 'yearly';

interface ReportPeriodNavProps {
  activePeriod: ReportPeriod;
}

const PERIOD_TABS: { id: ReportPeriod; label: string; path: string }[] = [
  { id: 'daily', label: 'Daily', path: '/reports/daily' },
  { id: 'monthly', label: 'Monthly', path: '/reports/monthly' },
  { id: 'yearly', label: 'Yearly', path: '/reports/yearly' },
];

export const ReportPeriodNav: React.FC<ReportPeriodNavProps> = ({ activePeriod }) => {
  const navigate = useNavigate();

  return (
    <div className="pt-4">
      <div className="bg-surface-container-low p-1 flex rounded-lg">
        {PERIOD_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => navigate(tab.path)}
            className={`flex-1 py-2 text-sm rounded-md transition-colors ${
              activePeriod === tab.id
                ? 'font-semibold bg-white shadow-sm text-primary'
                : 'font-medium text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
