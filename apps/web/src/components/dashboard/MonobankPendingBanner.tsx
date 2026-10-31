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
      role="region"
      aria-label="Monobank pending transactions alert"
      className="relative flex items-center justify-between gap-3 sm:gap-4 rounded-2xl border border-outline-variant/15 bg-surface-container-low/95 dark:bg-surface-container/85 px-4 py-3 shadow-sm backdrop-blur-md transition-all hover:border-outline-variant/30"
    >
      {/* Visual left accent bar */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-primary"
      />

      <div className="flex items-center gap-3 min-w-0 pl-1">
        {/* Monobank Icon Badge with live status indicator */}
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-highest/60 shadow-2xs ring-1 ring-outline-variant/10">
          <img
            src="/monobank-logo.svg"
            alt="Monobank"
            className="h-5 w-5 rounded-md object-contain"
          />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
        </div>

        {/* Text column */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-label text-[11px] font-bold uppercase tracking-wider text-secondary">
              Monobank Sync
            </span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
              {pendingCount} new
            </span>
          </div>
          <p className="truncate font-headline text-sm font-bold text-primary">
            {pendingCount === 1 ? '1 transaction' : `${pendingCount} transactions`} waiting for review
          </p>
          <p className="truncate font-body text-xs text-secondary hidden sm:block">
            Verify auto-matched categories &amp; link potential duplicates
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/integrations/monobank/pending')}
          className="group flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 font-body text-xs font-semibold text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-95"
        >
          <span>Review</span>
          <span className="material-symbols-outlined text-[15px] transition-transform group-hover:translate-x-0.5">
            arrow_forward
          </span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          className="rounded-full p-1.5 text-secondary transition-colors hover:bg-surface-container-high hover:text-primary active:scale-95"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </div>
  );
};
