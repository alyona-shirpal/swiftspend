import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import {
  useMonobankPendingImports,
  useAcceptMonobankImport,
  useDeclineMonobankImport,
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
  const acceptMutation = useAcceptMonobankImport();
  const declineMutation = useDeclineMonobankImport();

  const imports = data?.imports || [];

  const handleAccept = (item: MonobankPendingImport) => {
    acceptMutation.mutate({ id: item.id });
  };

  const handleDecline = (item: MonobankPendingImport) => {
    declineMutation.mutate({ id: item.id });
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
      <div className="flex items-center justify-between pb-1">
        <p className="font-body text-sm text-secondary">
          Review and confirm transactions imported from Monobank.
        </p>
        {imports.length > 0 && (
          <span className="font-label text-xs font-semibold bg-surface-container-high text-primary px-2.5 py-1 rounded-full">
            {imports.length} pending
          </span>
        )}
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
                    <p className="font-label text-xs text-secondary">
                      {formatImportDate(item.time)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-body font-bold text-title-md text-primary">
                      {formattedAmount}
                    </span>
                  </div>
                </div>

                {/* Suggested Category & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-outline-variant/10">
                  <div>
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
    </AppLayout>
  );
};
