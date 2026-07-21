import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Currency } from '@swiftspend/types';
import { useDailyReport } from '../../hooks/useReports';
import { useUserCurrencies } from '../../hooks/useUserCurrencies';
import { formatCurrency, getCurrencyIcon, getCurrencySymbol } from '../../utils/formatCurrency';
import { ReportSkeleton } from '../../components/ReportSkeleton';
import { ReportLayout } from '../../components/reports/ReportLayout';
import { ReportPeriodNav } from '../../components/reports/ReportPeriodNav';
import { TopCategoriesAccordion } from '../../components/reports/TopCategoriesAccordion';

export const DailyReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]!);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(Currency.EUR);
  
  const { data: userCurrencies } = useUserCurrencies();
  const { data: report, isLoading, error, refetch } = useDailyReport(selectedDate, selectedCurrency);
  
  const currencyOptions = userCurrencies?.currencies?.map((uc) => uc.currency as Currency) || [Currency.EUR];
  
  if (isLoading) {
    return <ReportSkeleton />;
  }
  
  if (error) {
    return (
      <ReportLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-4xl text-error mb-4">error</span>
          <h2 className="text-xl font-bold mb-2">Failed to load report</h2>
          <p className="text-secondary mb-4">Please try again later</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg"
          >
            Retry
          </button>
        </div>
      </ReportLayout>
    );
  }

  if (!report) {
    return <ReportSkeleton />;
  }
  
  // Handle empty state
  if (!report.has_data) {
    return (
      <ReportLayout>
        <ReportPeriodNav activePeriod="daily" />

          {/* Empty State */}
          <section className="flex flex-col items-center justify-center py-20">
            <span className="material-symbols-outlined text-6xl text-secondary mb-4">receipt_long</span>
            <h2 className="text-xl font-bold text-primary mb-2">No expenses yet</h2>
            <p className="text-secondary text-center mb-6">There are no expenses recorded for this day</p>
            <button 
              onClick={() => navigate('/expenses/new')}
              className="px-6 py-3 bg-primary text-on-primary rounded-lg font-medium"
            >
            Add Expense
          </button>
        </section>
      </ReportLayout>
    );
  }


  return (
    <ReportLayout>
      <ReportPeriodNav activePeriod="daily" />

        {/* Hero Card (Total Spending) */}
        <section className="relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="font-label text-[10px] font-medium tracking-[0.2em] text-secondary uppercase py-2 block">
                Daily Statement — {new Date(selectedDate!).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </span>
              {/* Currency Selector */}
              <div className="flex rounded-lg bg-surface-container-low p-1 mb-4">
                {currencyOptions.map((currency: Currency) => (
                  <button
                    key={currency}
                    onClick={() => setSelectedCurrency(currency)}
                    className={`rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider transition-all ${
                      selectedCurrency === currency
                        ? 'bg-surface-container-lowest text-primary shadow-sm'
                        : 'text-secondary hover:bg-surface-container-lowest/50'
                    }`}
                  >
                    {currency}
                  </button>
                ))}
              </div>
              <div className="flex items-baseline gap-4">
                <span className={`text-[2.5rem] text-primary ${selectedCurrency === Currency.UAH ? '' : 'material-symbols-outlined'}`}>
                  {selectedCurrency === Currency.UAH ? getCurrencySymbol(selectedCurrency) : getCurrencyIcon(selectedCurrency)}
                </span>
                <h2 className="font-headline text-[3.5rem] leading-none font-extrabold balance-text text-primary transition-all duration-300">
                  {formatCurrency(
                    selectedBarIndex !== null
                      ? (report.weekly_chart[selectedBarIndex]?.amount ?? 0)
                      : report.total,
                    selectedCurrency
                  ).replace(getCurrencySymbol(selectedCurrency), '')}
                </h2>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`material-symbols-outlined ${report.direction === 'up' ? 'text-error' : report.direction === 'down' ? 'text-primary' : 'text-secondary'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {report.direction === 'up' ? 'trending_up' : report.direction === 'down' ? 'trending_down' : 'trending_flat'}
                </span>
                <span className={`font-label text-sm font-semibold ${report.direction === 'up' ? 'text-error' : report.direction === 'down' ? 'text-primary' : 'text-secondary'}`}>
                  {report.direction === 'same' ? 'No change' : 
                   report.direction === 'up' ? `+${report.change_percent.toFixed(1)}% increase from yesterday` :
                   `-${report.change_percent.toFixed(1)}% decrease from yesterday`}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Primary Graph (Spending This Week) */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-bold font-headline">Spending This Week</h3>
            {selectedBarIndex !== null && (
              <span className="text-xs text-secondary font-medium">
                {report.weekly_chart[selectedBarIndex]?.day} — {formatCurrency(report.weekly_chart[selectedBarIndex]?.amount ?? 0, selectedCurrency)}
              </span>
            )}
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl space-y-4">
            <div className="flex items-end justify-between h-40 px-2">
              {report.weekly_chart.map((data, index) => {
                const maxAmount = Math.max(...report.weekly_chart.map(d => d.amount), 1);
                const heightPercentage = (data.amount / maxAmount) * 100;
                const heightPx = heightPercentage === 0 ? 8 :
                                 heightPercentage < 20 ? 32 :
                                 heightPercentage < 40 ? 64 :
                                 heightPercentage < 60 ? 96 :
                                 heightPercentage < 80 ? 128 : 160;
                const isSelected = selectedBarIndex === index;
                const isToday = data.is_today;
                
                return (
                  <button
                    key={index}
                    onClick={() => setSelectedBarIndex(isSelected ? null : index)}
                    className="flex flex-col items-center gap-2 group focus:outline-none"
                  >
                    <div
                      style={{ height: `${heightPx}px` }}
                      className={`w-3 rounded-full transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary scale-x-125 shadow-lg'
                          : isToday
                          ? 'bg-primary/60'
                          : 'bg-surface-container-high group-hover:bg-primary/40'
                      }`}
                    />
                    <span className={`text-[10px] font-medium transition-colors ${
                      isSelected ? 'text-primary font-bold' : isToday ? 'text-primary/70 font-semibold' : 'text-secondary'
                    }`}>{data.day}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Insights */}
        <section className="mb-4">
          <div className="p-5 bg-primary-container rounded-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-on-tertiary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-white" style={{fontVariationSettings: "'FILL' 1"}}>lightbulb</span>
            </div>
            <div className="flex-1">
              <h4 className="text-white text-xs font-bold uppercase tracking-widest opacity-60">Insights</h4>
              <p className="text-white font-medium text-sm">{report.insight}</p>
            </div>
            <span className="material-symbols-outlined text-white/40">chevron_right</span>
          </div>
        </section>

        {/* Category Breakdown */}
        <TopCategoriesAccordion
          categories={report.top_categories}
          currency={selectedCurrency}
          periodRange={{ from: selectedDate, to: selectedDate }}
          className="bg-surface-container-lowest rounded-xl overflow-hidden"
          headerClassName="px-6 py-4 border-b border-surface-container-low flex justify-between items-center"
          itemClassName="px-4 py-3 hover:bg-surface-container-low transition-colors"
      />
    </ReportLayout>
  );
};
