import React from 'react';
import { useNavigate } from 'react-router-dom';

export const ReportHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#f7f9fb] flex justify-between items-center w-full px-6 py-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-full hover:bg-surface-container-low/50 transition-colors"
        >
          <span className="material-symbols-outlined text-black">arrow_back</span>
        </button>
        <h1 className="text-xl font-extrabold font-headline tracking-tight text-black">Report</h1>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => navigate('/analytics')}
          aria-label="Analytics"
          className="p-2 rounded-full text-secondary hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined">paid</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="p-2 -mr-2 rounded-full text-secondary hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>
      </div>
    </header>
  );
};
