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
      mainClassName="space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <p className="font-body text-sm text-secondary">
          Review and confirm transactions imported from Monobank.
        </p>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {primaryIntegration && (
            <button
              type="button"
              onClick={handleSyncLatest}
              disabled={syncMutation.isPending}
              className="px-2.5 py-1 rounded-full border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container-high text-primary font-body text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1"
              title={primaryIntegration.last_synced_at ? 'Quick sync transactions since last sync' : 'Sync latest transactions'}
            >
              <span className={`material-symbols-outlined text-[14px] ${syncMutation.isPending ? 'animate-spin' : ''}`}>
                sync
              </span>
              {syncMutation.isPending ? 'Syncing…' : 'Sync latest'}
            </button>
          )}
          {imports.length > 0 && (
            <>
              <span className="font-label text-xs font-semibold bg-surface-container-high text-primary px-2.5 py-1 rounded-full">
                {imports.length} pending
              </span>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={clearAllMutation.isPending}
                className="px-2.5 py-1 rounded-full border border-error/30 bg-error-container/10 hover:bg-error-container/25 text-error font-body text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1"
                title="Dismiss all pending imports"
              >
                <span className="material-symbols-outlined text-[14px]">delete_sweep</span>
                {clearAllMutation.isPending ? 'Clearing…' : 'Clear all'}
              </button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/10 animate-pulse space-y-3"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-surface-container-high rounded w-1/3"></div>
                  <div className="h-4 bg-surface-container-high rounded w-1/4"></div>
                </div>
                <div className="h-6 bg-surface-container-high rounded w-20"></div>
              </div>
              <div className="h-8 bg-surface-container-high rounded w-full sm:w-1/2"></div>
            </div>
          ))}
        </div>
      ) : imports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-6">
          <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined text-3xl">task_alt</span>
          </div>
          <h3 className="font-headline font-bold text-lg text-primary">All caught up!</h3>
          <p className="font-body text-sm text-secondary mt-1">No pending imports.</p>
        </div>
      ) : (
        <div className="space-y-3">
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

            return (
              <div
                key={item.id}
                className="bg-surface-container-lowest rounded-xl p-4 sm:p-5 border border-outline-variant/10 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-body font-semibold text-title-sm text-primary truncate">
                        {item.description || 'Monobank transaction'}
                      </h4>
                      {item.hold && (
                        <span className="font-label text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-500/20 px-2 py-0.5 rounded-full">
                          Hold
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 font-label text-xs text-secondary">
                      <span>{formatImportDate(item.time)}</span>
                      {item.mcc && (
                        <span className="font-mono text-[11px] bg-surface-container-high px-1.5 py-0.2 rounded text-secondary">
                          MCC {item.mcc}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-body font-bold text-title-md text-primary block">
                      {formattedAmount}
                    </span>
                    {item.card_amount &&
                      item.card_currency &&
                      (item.card_currency !== item.currency || item.card_amount !== item.amount) && (
                        <span className="font-label text-xs text-secondary block mt-0.5" title="Amount debited from card">
                          ≈ -{formatCurrency(item.card_amount, item.card_currency as Currency)} (card)
                        </span>
                      )}
                  </div>
                </div>

                {/* Similar Transactions Found on Day of Transaction (within ±€1) */}
                {item.similar_expenses && item.similar_expenses.length > 0 && (
                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 sm:p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-label text-xs font-semibold text-amber-800 dark:text-amber-300">
                        <span className="material-symbols-outlined text-[16px]">
                          compare_arrows
                        </span>
                        <span>
                          Similar transaction{item.similar_expenses.length > 1 ? 's' : ''} on this day (within ±€1):
                        </span>
                      </div>
                      <span className="font-label text-[11px] font-medium text-secondary">
                        {item.similar_expenses.length} found
                      </span>
                    </div>

                    <div className="space-y-1.5">
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
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/15 hover:border-outline-variant/30 transition-colors"
                          >
                            {/* Short place and details */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-md bg-surface-container-low flex items-center justify-center shrink-0 text-secondary">
                                <span className="material-symbols-outlined text-[16px]">
                                  {sim.category?.icon || 'receipt'}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="font-body font-semibold text-xs text-primary truncate max-w-[140px] sm:max-w-[200px]"
                                    title={sim.place}
                                  >
                                    {sim.short_place || sim.place}
                                  </span>
                                  {sim.category && (
                                    <span className="font-label text-[10px] bg-surface-container-high text-secondary px-1.5 py-0.2 rounded-full hidden sm:inline-block">
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
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-outline-variant/10">
                              <div className="text-left sm:text-right">
                                <span className="font-body font-bold text-xs text-primary block">
                                  {formattedSimAmount}
                                </span>
                                {sim.diff_eur !== undefined && (
                                  <span
                                    className="font-label text-[10px] text-secondary block"
                                    title="Difference in EUR"
                                  >
                                    {sim.diff_eur === 0
                                      ? 'exact match'
                                      : `diff: ±${sim.diff_eur.toFixed(2)}€`}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/expenses/${sim.id}`)}
                                  className="p-1 rounded-md text-secondary hover:text-primary hover:bg-surface-container-high transition-colors"
                                  title="View existing expense details"
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    open_in_new
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleMatch(item, sim.id)}
                                  disabled={isProcessing}
                                  className="px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 font-body text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1"
                                  title="Link this Monobank transaction to this existing expense without creating a duplicate"
                                >
                                  {isMatchingThis ? (
                                    <>
                                      <svg
                                        className="w-3 h-3 animate-spin"
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
                                      <span className="material-symbols-outlined text-[14px]">
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

                {/* Suggested Category & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-outline-variant/10">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.suggested_category ? (
                      <span className="inline-flex items-center gap-1.5 font-label text-xs font-semibold bg-surface-container-high text-primary px-2.5 py-1 rounded-full">
                        <span className="material-symbols-outlined text-[15px]">
                          {item.suggested_category.icon}
                        </span>
                        <span>{item.suggested_category.name}</span>
                      </span>
                    ) : (
                      <span className="font-label text-xs text-secondary italic">
                        No category suggested
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedJsonItem(item)}
                      className="inline-flex items-center gap-1 font-label text-xs text-secondary hover:text-primary bg-surface-container-low hover:bg-surface-container-high px-2 py-1 rounded-full transition-colors"
                      title="View raw source JSON"
                    >
                      <span className="material-symbols-outlined text-[14px]">data_object</span>
                      <span>Source JSON</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDecline(item)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-lg border border-error/20 bg-error-container/10 hover:bg-error-container/20 text-error font-body text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">close</span>
                      Decline
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEditAndAccept(item)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-primary font-body text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      Edit &amp; Accept
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAccept(item)}
                      disabled={isProcessing}
                      className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary font-body text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
          <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[85vh] rounded-2xl p-5 sm:p-6 shadow-xl border border-outline-variant/10 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">data_object</span>
                <div>
                  <h3 className="font-display font-medium text-title-md text-primary">
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
                className="text-secondary hover:text-primary p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/15 text-left">
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
                className="py-2 px-3.5 font-body text-xs font-semibold bg-surface-container-low hover:bg-surface-container-high text-primary rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {hasCopiedJson ? 'done' : 'content_copy'}
                </span>
                {hasCopiedJson ? 'Copied!' : 'Copy JSON'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedJsonItem(null)}
                className="py-2 px-4 font-body text-xs font-semibold bg-primary text-on-primary rounded-xl hover:opacity-90 transition-opacity"
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
