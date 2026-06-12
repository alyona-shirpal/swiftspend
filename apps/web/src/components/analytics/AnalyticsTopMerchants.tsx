import React from 'react';
import { Currency } from '@swiftspend/types';
import { MerchantItem } from '../../types/analytics';
import { formatCurrency } from '../../utils/formatCurrency';

interface AnalyticsTopMerchantsProps {
  merchants: MerchantItem[];
  currency: Currency;
  isLoading?: boolean;
}

export const AnalyticsTopMerchants: React.FC<AnalyticsTopMerchantsProps> = ({
  merchants,
  currency,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
        <div className="h-5 w-36 bg-surface-container-highest rounded animate-pulse mb-6" />
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-surface-container-highest rounded animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (merchants.length === 0) {
    return (
      <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
        <h2 className="font-headline text-base font-bold mb-4">Top Merchants</h2>
        <p className="text-sm text-secondary">No merchant data for this period.</p>
      </section>
    );
  }

  return (
    <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
      <h2 className="font-headline text-base font-bold mb-6">Top Merchants</h2>
      <div className="space-y-5">
        {merchants.map((merchant) => (
          <div key={merchant.name} className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">{merchant.categoryIcon}</span>
              </div>
              <div>
                <p className="text-sm font-bold">{merchant.name}</p>
                <p className="text-xs text-outline">{merchant.categoryName}</p>
              </div>
            </div>
            <p className="font-headline font-bold text-primary">
              {formatCurrency(merchant.total, currency)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
