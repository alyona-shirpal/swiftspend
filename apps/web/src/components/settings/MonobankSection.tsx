import React, { useState } from 'react';
import {
  useMonobankStatus,
  useConnectMonobank,
  useDisconnectMonobank,
  useSyncMonobank,
} from '../../hooks/useMonobankIntegration';
import { MonobankIntegration, MonobankAccount } from '@swiftspend/types';

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

const CURRENCY_CODE_MAP: Record<number, string> = {
  980: 'UAH',
  978: 'EUR',
  840: 'USD',
  8: 'ALL',
};

function getCurrencyCode(code: number): string {
  return CURRENCY_CODE_MAP[code] || String(code);
}

function truncateClientId(id: string | null): string {
  if (!id) return '—';
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

interface SyncPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (period: { from?: string; to?: string }) => void;
  isInitial?: boolean;
}

function SyncPeriodModal({ isOpen, onClose, onConfirm, isInitial }: SyncPeriodModalProps) {
  const getDefaultDates = (days: number) => {
    const to = new Date().toISOString().split('T')[0];
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const from = fromDate.toISOString().split('T')[0];
    return { from, to };
  };

  const [preset, setPreset] = useState<'30' | '60' | '90' | 'custom'>('30');
  const [customFrom, setCustomFrom] = useState(() => getDefaultDates(30).from);
  const [customTo, setCustomTo] = useState(() => getDefaultDates(30).to);

  if (!isOpen) return null;

  const handleApply = () => {
    if (preset === 'custom') {
      onConfirm({ from: customFrom, to: customTo });
    } else {
      const { from, to } = getDefaultDates(parseInt(preset, 10));
      onConfirm({ from, to });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-variant/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-6 shadow-xl border border-outline-variant/10 space-y-5">
        <div>
          <h3 className="font-headline font-bold text-lg text-primary">
            {isInitial ? 'Initial Sync Period' : 'Select Sync Period'}
          </h3>
          <p className="font-body text-xs text-secondary mt-1">
            Choose the date range to import transactions from Monobank.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {(['30', '60', '90'] as const).map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setPreset(days)}
              className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                preset === days
                  ? 'bg-primary text-on-primary border-primary shadow-sm'
                  : 'bg-surface-container-low text-primary border-transparent hover:bg-surface-container'
              }`}
            >
              {days} days
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPreset('custom')}
            className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
              preset === 'custom'
                ? 'bg-primary text-on-primary border-primary shadow-sm'
                : 'bg-surface-container-low text-primary border-transparent hover:bg-surface-container'
            }`}
          >
            Custom
          </button>
        </div>

        {preset === 'custom' && (
          <div className="space-y-3 pt-1 animate-in fade-in">
            <div>
              <label className="block text-[11px] font-semibold text-secondary uppercase tracking-wider mb-1">
                From Date
              </label>
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full bg-surface-container-high border-none rounded-lg p-2.5 text-xs text-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-secondary uppercase tracking-wider mb-1">
                To Date
              </label>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full bg-surface-container-high border-none rounded-lg p-2.5 text-xs text-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-3 font-body text-xs font-semibold text-secondary hover:bg-surface-container-high rounded-xl transition-colors"
          >
            {isInitial ? 'Skip Sync' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 px-3 font-body text-xs font-semibold bg-primary text-on-primary rounded-xl hover:opacity-90 transition-opacity"
          >
            Sync Transactions
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConnectFormProps {
  onSuccess?: (integrationId: string) => void;
  onCancel?: () => void;
  isExpandable?: boolean;
}

function ConnectForm({ onSuccess, onCancel, isExpandable }: ConnectFormProps) {
  const [token, setToken] = useState('');
  const [displayName, setDisplayName] = useState('');
  const connect = useConnectMonobank();

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    connect.mutate(
      { token: token.trim(), displayName: displayName.trim() || undefined },
      {
        onSuccess: (data: any) => {
          setToken('');
          setDisplayName('');
          onSuccess?.(data?.id);
        },
      }
    );
  };

  return (
    <form onSubmit={handleConnect} className="space-y-4">
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left sm:gap-4">
        <img
          src="/monobank-logo.svg"
          alt="Monobank"
          className="w-12 h-12 rounded-xl shrink-0"
        />
        <div>
          <p className="font-body font-semibold text-title-md text-primary">
            Connect your Monobank account
          </p>
          <p className="font-body text-body-sm text-on-surface-variant mt-0.5">
            Auto-import transactions to review
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-surface-container-low p-4 text-xs font-body text-on-surface-variant space-y-2">
        <div className="flex items-center justify-between">
          <span>Step 1: Open Monobank developer portal</span>
          <a
            href="https://api.monobank.ua"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            Get your token →
          </a>
        </div>
        <p>Step 2: Scan the QR code with your Monobank app</p>
        <p>Step 3: Paste token below</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">
            Display name (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Personal Card"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={connect.isPending}
            className="w-full bg-surface-container-high border-none rounded-lg p-3 text-sm text-primary placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-on-surface-variant mb-1">
            API Token
          </label>
          <input
            type="password"
            placeholder="Paste your token here"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={connect.isPending}
            required
            className="w-full bg-surface-container-high border-none rounded-lg p-3 text-sm text-primary font-mono placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={!token.trim() || connect.isPending}
          className="flex-1 py-3 px-4 bg-primary text-on-primary font-body text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {connect.isPending ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>Connecting…</span>
            </>
          ) : (
            'Connect Monobank'
          )}
        </button>

        {isExpandable && (
          <button
            type="button"
            onClick={onCancel}
            disabled={connect.isPending}
            className="py-3 px-4 font-body text-sm font-semibold text-secondary hover:bg-surface-container-high rounded-xl transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function IntegrationCard({
  integration,
  onDisconnect,
  onSync,
  isSyncing,
  isDisconnecting,
}: {
  integration: MonobankIntegration;
  onDisconnect: (id: string) => void;
  onSync: (id: string) => void;
  isSyncing: boolean;
  isDisconnecting: boolean;
}) {
  return (
    <div className="space-y-4 pt-4 first:pt-0">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/monobank-logo.svg"
            alt="Monobank"
            className="w-8 h-8 rounded-lg shrink-0"
          />
          <div>
            <h4 className="font-body font-semibold text-title-sm text-primary">
              {integration.display_name || 'Monobank Account'}
            </h4>
            <p className="font-body text-xs text-on-surface-variant font-mono">
              Client: {truncateClientId(integration.monobank_client_id)}
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1 font-label text-[11px] font-semibold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-sm uppercase tracking-wider">
          <span className="material-symbols-outlined text-[13px] text-green-600">check_circle</span>
          Connected
        </span>
      </div>

      {/* Account currency badges */}
      <div className="flex items-center justify-between">
        <span className="font-body text-body-sm text-on-surface-variant">Accounts</span>
        <div className="flex flex-wrap gap-1.5 justify-end">
          {integration.monobank_accounts && integration.monobank_accounts.length > 0 ? (
            integration.monobank_accounts.map((acc: MonobankAccount) => {
              const currency = getCurrencyCode(acc.currencyCode);
              const last4 = acc.maskedPan?.[0]?.slice(-4);
              return (
                <span
                  key={acc.id}
                  className="font-label text-xs font-semibold bg-surface-container-high text-primary px-2.5 py-0.5 rounded-full"
                >
                  {currency}
                  {last4 ? ` •• ${last4}` : ''}
                </span>
              );
            })
          ) : (
            <span className="font-body text-xs text-on-surface-variant">—</span>
          )}
        </div>
      </div>

      {/* Last synced */}
      <div className="flex items-center justify-between">
        <span className="font-body text-body-sm text-on-surface-variant">Last synced</span>
        <span className="font-body text-sm text-primary">
          {formatRelativeTime(integration.last_synced_at)}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-outline-variant/10">
        <button
          onClick={() => onSync(integration.id)}
          disabled={isSyncing}
          className="flex-1 py-3 font-body text-sm font-semibold text-primary bg-surface-container-low hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSyncing ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>Syncing…</span>
            </>
          ) : (
            'Sync Now'
          )}
        </button>
        <button
          onClick={() => onDisconnect(integration.id)}
          disabled={isDisconnecting}
          className="flex-1 py-3 font-body text-sm font-semibold text-error hover:bg-error-container/20 rounded-lg border border-error/20 transition-colors disabled:opacity-50"
        >
          {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
        </button>
      </div>
    </div>
  );
}

export function MonobankSection() {
  const { data: statusData, isLoading } = useMonobankStatus();
  const disconnect = useDisconnectMonobank();
  const sync = useSyncMonobank();
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncModalIntegrationId, setSyncModalIntegrationId] = useState<string | null>(null);
  const [isInitialSync, setIsInitialSync] = useState(false);

  const integrations = statusData?.integrations || [];
  const hasIntegrations = integrations.length > 0;

  const handleDisconnect = (id: string) => {
    if (window.confirm('Disconnect this Monobank account? Pending transactions will remain.')) {
      disconnect.mutate(id);
    }
  };

  const handleOpenSyncModal = (id: string, isInitial: boolean = false) => {
    setSyncModalIntegrationId(id);
    setIsInitialSync(isInitial);
  };

  const handleConfirmSync = (period: { from?: string; to?: string }) => {
    if (!syncModalIntegrationId) return;
    const integrationId = syncModalIntegrationId;
    setSyncModalIntegrationId(null);
    sync.mutate({
      integrationId,
      from: period.from,
      to: period.to,
    });
  };

  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <h3 className="font-display font-medium text-headline-sm text-primary">Monobank</h3>
        {hasIntegrations && (
          <span className="flex items-center gap-1 font-label text-xs font-semibold text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-sm uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px] text-green-600">check_circle</span>
            Connected
          </span>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : !hasIntegrations ? (
          <ConnectForm
            onSuccess={(integrationId) => {
              if (integrationId) {
                handleOpenSyncModal(integrationId, true);
              }
            }}
          />
        ) : (
          <div className="space-y-6 divide-y divide-outline-variant/10">
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onDisconnect={handleDisconnect}
                onSync={(id) => handleOpenSyncModal(id, false)}
                isSyncing={sync.isPending && sync.variables?.integrationId === integration.id}
                isDisconnecting={disconnect.isPending && disconnect.variables === integration.id}
              />
            ))}

            {showAddForm ? (
              <div className="pt-6 border-t border-outline-variant/10">
                <ConnectForm
                  isExpandable
                  onSuccess={(integrationId) => {
                    setShowAddForm(false);
                    if (integrationId) {
                      handleOpenSyncModal(integrationId, true);
                    }
                  }}
                  onCancel={() => setShowAddForm(false)}
                />
              </div>
            ) : (
              <div className="pt-4 border-t border-outline-variant/10">
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="w-full py-3 font-body text-sm font-semibold text-primary bg-surface-container-low hover:bg-surface-container-high rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Add another account
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <SyncPeriodModal
        isOpen={Boolean(syncModalIntegrationId)}
        onClose={() => setSyncModalIntegrationId(null)}
        onConfirm={handleConfirmSync}
        isInitial={isInitialSync}
      />
    </section>
  );
}
