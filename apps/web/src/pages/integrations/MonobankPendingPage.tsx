import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import {
  useMonobankPendingImports,
  useAcceptMonobankImport,
  useDeclineMonobankImport,
  useClearAllMonobankImports,
  useMonobankStatus,
  useSyncMonobank,
} from '../../hooks/useMonobankIntegration';
import { formatCurrency } from '../../utils/formatCurrency';
import { getMccDescription } from '../../utils/mcc';
import { Currency, MonobankPendingImport } from '@swiftspend/types';

function formatImportDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('default', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return 'never';
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const MonobankPendingPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useMonobankPendingImports();
  const { data: statusData } = useMonobankStatus();
  const syncMutation = useSyncMonobank();
  const acceptMutation = useAcceptMonobankImport();
  const declineMutation = useDeclineMonobankImport();
  const clearAllMutation = useClearAllMonobankImports();
  const [selectedJsonItem, setSelectedJsonItem] = useState<MonobankPendingImport | null>(null);
  const [hasCopiedJson, setHasCopiedJson] = useState(false);

  const imports = data?.imports || [];
  const primaryIntegration = statusData?.integrations?.[0];

  // Calculate high-level summary metrics
  const totalVolume = imports.reduce((sum, item) => sum + (item.amount || 0), 0);
  const duplicatesCount = imports.filter(
    (item) => item.similar_expenses && item.similar_expenses.length > 0
  ).length;

  const handleCopyJson = (payload: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setHasCopiedJson(true);
    setTimeout(() => setHasCopiedJson(false), 2000);
  };

  const handleSyncLatest = () => {
    if (primaryIntegration?.id) {
      syncMutation.mutate({ integrationId: primaryIntegration.id });
    }
  };

  const handleAccept = (item: MonobankPendingImport) => {
    acceptMutation.mutate({ id: item.id });
  };

  const handleDecline = (item: MonobankPendingImport) => {
    declineMutation.mutate({ id: item.id });
  };

  const handleMatch = (item: MonobankPendingImport, expenseId: string) => {
    acceptMutation.mutate({ id: item.id, match_expense_id: expenseId });
  };

  const handleClearAll = () => {
    if (window.confirm(`Are you sure you want to dismiss all ${imports.length} pending imports?`)) {
      clearAllMutation.mutate();
    }
  };

  const handleEditAndAccept = (item: MonobankPendingImport) => {
    navigate('/expenses/new', {
      state: {
        monoImportId: item.id,
        prefill: {
          amount: item.amount,
          currency: item.currency,
          merchant: item.description,
          date: item.time.split('T')[0],
          category_id: item.suggested_category?.id,
        },
      },
    });
  };

  return (
    <AppLayout
      title="Monobank Imports"
      backTo="/"
      width="3xl"
      mainClassName="space-y-5"
    >
      {/* Hero Stats & Quick Actions Bar */}
      <div className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-label text-xs font-bold uppercase tracking-wider text-secondary">
                Review Workbench
              </span>
              {primaryIntegration?.last_synced_at && (
                <span className="font-label text-[11px] text-secondary/70">
                  • Synced {formatRelativeTime(primaryIntegration.last_synced_at)}
                </span>
              )}
            </div>
            <p className="font-body text-sm text-secondary">
              Confirm incoming transactions, review auto-matched categories, and resolve duplicates.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
            {primaryIntegration && (
              <button
                type="button"
                onClick={handleSyncLatest}
                disabled={syncMutation.isPending}
                className="px-3 py-1.5 rounded-full border border-outline-variant/20 bg-surface-container-low hover:bg-surface-container-high text-primary font-body text-xs font-semibold transition-all hover:border-outline-variant/40 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                title={
                  primaryIntegration.last_synced_at
                    ? `Quick sync transactions since ${formatRelativeTime(primaryIntegration.last_synced_at)}`
                    : 'Sync latest transactions'
                }
              >
                <span
                  className={`material-symbols-outlined text-[15px] ${
                    syncMutation.isPending ? 'animate-spin' : ''
                  }`}
                >
                  sync
                </span>
                <span>{syncMutation.isPending ? 'Syncing…' : 'Sync latest'}</span>
              </button>
            )}

            {imports.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={clearAllMutation.isPending}
                className="px-3 py-1.5 rounded-full border border-error/20 bg-error-container/10 hover:bg-error-container/25 text-error font-body text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                title="Dismiss all pending imports"
              >
                <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
                <span>{clearAllMutation.isPending ? 'Clearing…' : 'Clear all'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Metrics Chips (only shown when there are imports) */}
        {!isLoading && imports.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-outline-variant/10">
            {/* Pending count */}
            <div className="rounded-xl bg-surface-container-low/70 px-3 py-2 flex flex-col">
              <span className="font-label text-[10px] uppercase font-bold tracking-wider text-secondary">
                To Review
              </span>
              <span className="font-headline text-lg font-extrabold text-primary">
                {imports.length} {imports.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Total Pending Volume */}
            <div className="rounded-xl bg-surface-container-low/70 px-3 py-2 flex flex-col">
              <span className="font-label text-[10px] uppercase font-bold tracking-wider text-secondary">
                Pending Volume
              </span>
              <span className="font-headline text-lg font-extrabold text-primary">
                -{formatCurrency(totalVolume, Currency.EUR)}
              </span>
            </div>

            {/* Duplicate Candidates Status */}
            <div
              className={`col-span-2 sm:col-span-1 rounded-xl px-3 py-2 flex flex-col transition-colors ${
                duplicatesCount > 0
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200'
                  : 'bg-surface-container-low/70 text-secondary'
              }`}
            >
              <span className="font-label text-[10px] uppercase font-bold tracking-wider opacity-80 flex items-center gap-1">
                {duplicatesCount > 0 && (
                  <span className="material-symbols-outlined text-[13px] text-amber-600 dark:text-amber-400">
                    warning
                  </span>
                )}
                Duplicates Check
              </span>
              <span className="font-headline text-lg font-extrabold">
                {duplicatesCount > 0
                  ? `${duplicatesCount} candidate${duplicatesCount === 1 ? '' : 's'}`
                  : 'None detected'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="space-y-3.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/10 animate-pulse space-y-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 flex-1">
                  <div className="w-11 h-11 bg-surface-container-high rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-surface-container-high rounded-md w-1/3" />
                    <div className="h-3 bg-surface-container-high rounded-md w-1/4" />
                  </div>
                </div>
                <div className="h-6 bg-surface-container-high rounded-md w-24" />
              </div>
              <div className="h-8 bg-surface-container-high rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : imports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm space-y-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-3xl">task_alt</span>
            <div className="absolute -inset-1 rounded-2xl border-2 border-primary/20 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="font-headline font-bold text-xl text-primary">You're all caught up!</h3>
            <p className="font-body text-sm text-secondary max-w-sm">
              All Monobank transactions have been reviewed and categorized. New card transactions will appear here automatically.
            </p>
          </div>
          {primaryIntegration && (
            <button
              type="button"
              onClick={handleSyncLatest}
              disabled={syncMutation.isPending}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-low hover:bg-surface-container-high text-primary font-body text-xs font-semibold transition-all border border-outline-variant/20 hover:border-outline-variant/40 active:scale-95 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-base ${syncMutation.isPending ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>{syncMutation.isPending ? 'Checking for transactions…' : 'Sync Monobank Now'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {imports.map((item) => {
            const isAccepting =
              acceptMutation.isPending && acceptMutation.variables?.id === item.id;
            const isDeclining =
              declineMutation.isPending && declineMutation.variables?.id === item.id;
            const isProcessing = isAccepting || isDeclining;

            const formattedAmount = `-${formatCurrency(
              item.amount,
              item.currency as Currency
            )}`;

            const mccDesc = getMccDescription(item.mcc);
            const iconName = item.suggested_category?.icon || 'receipt';

            return (
              <div
                key={item.id}
                className="group relative bg-surface-container-lowest rounded-2xl p-4 sm:p-5 border border-outline-variant/15 shadow-sm hover:shadow-md hover:border-outline-variant/30 transition-all duration-200 space-y-4"
              >
                {/* Main Card Header */}
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  {/* Left: Category/Provider Icon Avatar & Description */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-container-low shadow-2xs ring-1 ring-outline-variant/10">
                      <span className="material-symbols-outlined text-primary text-xl">
                        {iconName}
                      </span>
                      <img
                        src="/monobank-logo.svg"
                        alt="Monobank"
                        className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full ring-2 ring-surface-container-lowest object-contain"
                        title="Monobank Transaction"
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className="font-headline font-bold text-base sm:text-lg text-primary truncate tracking-tight"
                          title={item.description || undefined}
                        >
                          {item.description || 'Monobank transaction'}
                        </h4>
                        {item.hold && (
                          <span className="inline-flex items-center gap-1 font-label text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full">
                            <span className="material-symbols-outlined text-[11px]">schedule</span>
                            Hold
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 font-label text-xs text-secondary">
                        <span>{formatImportDate(item.time)}</span>
                        {item.mcc && (
                          <>
                            <span className="text-outline-variant/40">•</span>
                            <span
                              className="font-mono text-[11px] bg-surface-container-high px-2 py-0.5 rounded-md text-secondary"
                              title={mccDesc ? `MCC ${item.mcc}: ${mccDesc}` : `MCC ${item.mcc}`}
                            >
                              MCC {item.mcc}
                              {mccDesc && (
                                <span className="font-sans ml-1 text-secondary/80 hidden sm:inline">
                                  ({mccDesc})
                                </span>
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount block */}
                  <div className="text-right shrink-0">
                    <span className="font-headline font-extrabold text-lg sm:text-xl text-primary tracking-tight block">
                      {formattedAmount}
                    </span>
                    {item.card_amount &&
                      item.card_currency &&
                      (item.card_currency !== item.currency || item.card_amount !== item.amount) && (
                        <span
                          className="font-label text-xs text-secondary/80 block mt-0.5"
                          title="Amount debited from card in card currency"
                        >
                          ≈ -{formatCurrency(item.card_amount, item.card_currency as Currency)} (card)
                        </span>
                      )}
                  </div>
                </div>

                {/* Similar Transactions Found on Day of Transaction (within ±€1) */}
                {item.similar_expenses && item.similar_expenses.length > 0 && (
                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.04] dark:bg-amber-500/[0.08] p-3 sm:p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-label text-xs font-bold text-amber-900 dark:text-amber-200">
                        <span className="material-symbols-outlined text-[17px] text-amber-700 dark:text-amber-400">
                          compare_arrows
                        </span>
                        <span>
                          Potential duplicate on this day (within ±€1.00):
                        </span>
                      </div>
                      <span className="font-label text-[11px] font-semibold text-secondary bg-surface-container-lowest/80 px-2 py-0.5 rounded-full border border-outline-variant/10">
                        {item.similar_expenses.length} candidate{item.similar_expenses.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {item.similar_expenses.map((sim) => {
                        const isMatchingThis =
                          acceptMutation.isPending &&
                          acceptMutation.variables?.id === item.id &&
                          acceptMutation.variables?.match_expense_id === sim.id;

                        const formattedSimAmount = `-${formatCurrency(
                          sim.amount,
                          sim.currency as Currency
                        )}`;

                        return (
                          <div
                            key={sim.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/15 shadow-2xs hover:border-outline-variant/30 transition-all"
                          >
                            {/* Short place and details */}
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0 text-secondary ring-1 ring-outline-variant/10">
                                <span className="material-symbols-outlined text-[17px]">
                                  {sim.category?.icon || 'receipt'}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="font-headline font-semibold text-xs sm:text-sm text-primary truncate max-w-[160px] sm:max-w-[220px]"
                                    title={sim.place}
                                  >
                                    {sim.short_place || sim.place}
                                  </span>
                                  {sim.category && (
                                    <span className="font-label text-[10px] font-semibold bg-surface-container-high text-secondary px-1.5 py-0.2 rounded-full hidden sm:inline-block">
                                      {sim.category.name}
                                    </span>
                                  )}
                                </div>
                                <p className="font-label text-[11px] text-secondary truncate">
                                  {sim.description && sim.description !== sim.place
                                    ? sim.description
                                    : sim.date}
                                </p>
                              </div>
                            </div>

                            {/* Expense amount, diff, and actions */}
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/10">
                              <div className="text-left sm:text-right">
                                <span className="font-headline font-bold text-xs sm:text-sm text-primary block">
                                  {formattedSimAmount}
                                </span>
                                {sim.diff_eur !== undefined && (
                                  <div>
                                    {sim.diff_eur === 0 ? (
                                      <span className="inline-flex items-center gap-1 font-label text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full">
                                        Exact match
                                      </span>
                                    ) : (
                                      <span
                                        className="font-label text-[10px] font-medium text-secondary"
                                        title="Difference in EUR"
                                      >
                                        ±{sim.diff_eur.toFixed(2)}€ diff
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/expenses/${sim.id}`)}
                                  className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-container-high transition-colors"
                                  title="View existing expense details"
                                >
                                  <span className="material-symbols-outlined text-[17px]">
                                    open_in_new
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleMatch(item, sim.id)}
                                  disabled={isProcessing}
                                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-200 font-body text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 active:scale-95 shadow-2xs"
                                  title="Link this Monobank transaction to this existing expense without creating a duplicate"
                                >
                                  {isMatchingThis ? (
                                    <>
                                      <svg
                                        className="w-3.5 h-3.5 animate-spin"
                                        viewBox="0 0 24 24"
                                        fill="none"
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
                                      <span>Linking…</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="material-symbols-outlined text-[15px]">
                                        link
                                      </span>
                                      <span>Link</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Suggested Category & Card Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-outline-variant/10">
                  {/* Left: Suggested category pill & Source JSON trigger */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.suggested_category ? (
                      <span className="inline-flex items-center gap-1.5 font-label text-xs font-medium bg-surface-container-high text-primary px-3 py-1 rounded-full border border-outline-variant/10">
                        <span className="material-symbols-outlined text-[15px] text-secondary">
                          {item.suggested_category.icon}
                        </span>
                        <span className="font-semibold">{item.suggested_category.name}</span>
                        <span className="text-[10px] text-secondary/70 uppercase tracking-wider font-bold ml-0.5">
                          Auto-matched
                        </span>
                      </span>
                    ) : (
                      <span className="font-label text-xs text-secondary/70 italic px-2 py-0.5">
                        No category matched
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedJsonItem(item)}
                      className="inline-flex items-center gap-1 font-label text-xs text-secondary hover:text-primary bg-surface-container-low hover:bg-surface-container-high px-2.5 py-1 rounded-full transition-colors active:scale-95"
                      title="View raw source JSON"
                    >
                      <span className="material-symbols-outlined text-[14px]">data_object</span>
                      <span>Source JSON</span>
                    </button>
                  </div>

                  {/* Right: Primary Card Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecline(item)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-xl border border-error/25 bg-error-container/10 hover:bg-error-container/20 text-error font-body text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[15px]">close</span>
                      <span>Decline</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEditAndAccept(item)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high text-primary font-body text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      <span>Edit &amp; Accept</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAccept(item)}
                      disabled={isProcessing}
                      className="px-4 py-1.5 rounded-xl bg-primary text-on-primary font-body text-xs font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-sm flex items-center gap-1.5"
                    >
                      {isAccepting ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                          <span>Accepting…</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[15px]">check</span>
                          <span>Accept</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Raw Source JSON Modal */}
      {selectedJsonItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[85vh] rounded-2xl p-5 sm:p-6 shadow-2xl border border-outline-variant/15 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-surface-container-low flex items-center justify-center text-primary ring-1 ring-outline-variant/10">
                  <span className="material-symbols-outlined text-lg">data_object</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-title-md text-primary">
                    Source Transaction JSON
                  </h3>
                  <p className="font-body text-xs text-secondary truncate max-w-xs sm:max-w-md">
                    {selectedJsonItem.description || selectedJsonItem.external_id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJsonItem(null)}
                className="text-secondary hover:text-primary p-1.5 rounded-lg hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-surface-container-low/60 rounded-xl p-4 border border-outline-variant/15 text-left">
              <pre className="font-mono text-xs text-primary whitespace-pre-wrap break-all leading-relaxed">
                {JSON.stringify(
                  selectedJsonItem.raw_payload || {
                    id: selectedJsonItem.external_id,
                    time: selectedJsonItem.time,
                    description: selectedJsonItem.description,
                    mcc: selectedJsonItem.mcc,
                    amount: selectedJsonItem.amount,
                    currency: selectedJsonItem.currency,
                    hold: selectedJsonItem.hold,
                    account_id: selectedJsonItem.account_id,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10">
              <button
                type="button"
                onClick={() =>
                  handleCopyJson(
                    selectedJsonItem.raw_payload || {
                      id: selectedJsonItem.external_id,
                      time: selectedJsonItem.time,
                      description: selectedJsonItem.description,
                      mcc: selectedJsonItem.mcc,
                      amount: selectedJsonItem.amount,
                      currency: selectedJsonItem.currency,
                      hold: selectedJsonItem.hold,
                      account_id: selectedJsonItem.account_id,
                    }
                  )
                }
                className="py-2 px-3.5 font-body text-xs font-semibold bg-surface-container-low hover:bg-surface-container-high text-primary rounded-xl transition-all active:scale-95 flex items-center gap-1.5 border border-outline-variant/15"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {hasCopiedJson ? 'done' : 'content_copy'}
                </span>
                <span>{hasCopiedJson ? 'Copied!' : 'Copy JSON'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedJsonItem(null)}
                className="py-2 px-4 font-body text-xs font-semibold bg-primary text-on-primary rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
