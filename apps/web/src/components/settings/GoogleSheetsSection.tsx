import React from 'react';
import { useGoogleSheetsIntegration } from '../../hooks/useGoogleSheetsIntegration';

function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return 'never';
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function GoogleSheetsSection() {
  const { status, sync, disconnect, initiateOAuth } = useGoogleSheetsIntegration();

  const data = status.data;
  const isSyncing = data?.syncStatus === 'syncing';

  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <h3 className="font-display font-medium text-headline-sm text-primary">Google Sheets</h3>
        {data?.connected && (
          <span className="flex items-center gap-1 font-label text-xs font-semibold text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-sm uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px] text-green-600">check_circle</span>
            Connected
          </span>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-6">
        {!data?.connected ? (
          /* ── Disconnected State ── */
          <div className="flex flex-col items-center gap-6 py-2">
            <div className="flex flex-col items-center gap-4 text-center">
              {/* Google Sheets icon */}
              <svg viewBox="0 0 24 24" className="w-10 h-10" aria-hidden="true">
                <rect width="24" height="24" rx="4" fill="#0F9D58" />
                <path d="M6 8h12v1.5H6zm0 3h12v1.5H6zm0 3h8v1.5H6z" fill="white" />
                <path d="M14 5v6h5V5h-5zm1 1h3v4h-3V6z" fill="white" />
              </svg>
              <div>
                <p className="font-body font-semibold text-title-md text-primary">
                  Sync expenses to Google Sheets
                </p>
                <p className="font-body text-body-sm text-on-surface-variant mt-1">
                  Export to a spreadsheet with charts &amp; formulas
                </p>
              </div>
            </div>
            <button
              onClick={initiateOAuth}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-body text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                <rect width="24" height="24" rx="3" fill="#0F9D58" />
                <path d="M6 8h12v1.5H6zm0 3h12v1.5H6zm0 3h8v1.5H6z" fill="white" />
              </svg>
              Connect Google Sheets
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        ) : (
          /* ── Connected State ── */
          <div className="space-y-5">
            {/* Spreadsheet link */}
            <div className="flex items-center justify-between">
              <span className="font-body text-body-sm text-on-surface-variant">Spreadsheet</span>
              {data.spreadsheetId ? (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-body text-sm font-semibold text-primary hover:underline"
                >
                  Open
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              ) : (
                <span className="font-body text-sm text-on-surface-variant">—</span>
              )}
            </div>

            {/* Last synced */}
            <div className="flex items-center justify-between">
              <span className="font-body text-body-sm text-on-surface-variant">Last synced</span>
              <span className="font-body text-sm text-primary">
                {formatRelativeTime(data.lastSyncedAt)}
              </span>
            </div>

            {/* Sync status badge */}
            <div className="flex items-center justify-between">
              <span className="font-body text-body-sm text-on-surface-variant">Status</span>
              {data.syncStatus === 'idle' && (
                <span className="font-label text-xs bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full">
                  Idle
                </span>
              )}
              {data.syncStatus === 'syncing' && (
                <span className="flex items-center gap-1.5 font-label text-xs text-primary font-semibold">
                  <svg
                    className="w-3.5 h-3.5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-label="Syncing"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Syncing…
                </span>
              )}
              {data.syncStatus === 'error' && (
                <span
                  className="font-label text-xs text-error bg-error-container/30 px-2 py-0.5 rounded-full max-w-[160px] truncate"
                  title={data.syncError ?? undefined}
                >
                  {data.syncError || 'Error'}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-outline-variant/10">
              <button
                onClick={() => sync.mutate()}
                disabled={isSyncing || sync.isPending}
                className="flex-1 py-3 font-body text-sm font-semibold text-primary bg-surface-container-low hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-50"
              >
                {sync.isPending ? 'Starting…' : 'Sync Now'}
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Disconnect Google Sheets? Your spreadsheet will not be deleted.')) {
                    disconnect.mutate();
                  }
                }}
                disabled={disconnect.isPending}
                className="flex-1 py-3 font-body text-sm font-semibold text-error hover:bg-error-container/20 rounded-lg border border-error/20 transition-colors disabled:opacity-50"
              >
                {disconnect.isPending ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
