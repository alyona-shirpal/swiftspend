import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMonobankStatus } from '../../hooks/useMonobankIntegration';

const DISMISSED_KEY = 'mono_banner_dismissed_count';

export const MonobankPendingBanner: React.FC = () => {
  const navigate = useNavigate();
  const { data: statusData } = useMonobankStatus();
  const pendingCount = statusData?.pendingCount ?? 0;

  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Clear any persistent suppression from previous versions so transactions show in all sessions
    try {
      localStorage.removeItem(DISMISSED_KEY);
    } catch {
      // ignore
    }

    if (pendingCount <= 0) {
      setIsDismissed(false);
      return;
    }

    try {
      const dismissedStr = sessionStorage.getItem(DISMISSED_KEY);
      if (dismissedStr !== null) {
        const dismissedCount = parseInt(dismissedStr, 10);
        if (!isNaN(dismissedCount) && pendingCount <= dismissedCount) {
          setIsDismissed(true);
          return;
        }
      }
    } catch {
      // ignore
    }

    setIsDismissed(false);
  }, [pendingCount]);

  if (pendingCount <= 0 || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(DISMISSED_KEY, String(pendingCount));
    } catch {
      // ignore
    }
    setIsDismissed(true);
  };

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-on-surface shadow-sm"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-lg leading-none" role="img" aria-label="Bank">
          🏦
        </span>
        <p className="truncate font-body text-sm font-medium text-primary">
          <span className="font-bold">{pendingCount}</span> Monobank transaction
          {pendingCount === 1 ? '' : 's'} to review
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/integrations/monobank/pending')}
          className="flex items-center gap-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1.5 font-body text-xs font-semibold text-primary transition-colors"
        >
          Review
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          className="rounded-lg p-1 text-secondary transition-colors hover:bg-amber-500/20 hover:text-primary"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </div>
  );
};
