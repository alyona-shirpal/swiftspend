import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Currency } from '@swiftspend/types';
import { useMonthlyReport } from '../../hooks/useReports';
import { useUserCurrencies } from '../../hooks/useUserCurrencies';
import { formatCurrency, getCurrencyIcon, getCurrencySymbol } from '../../utils/formatCurrency';
import { ReportSkeleton } from '../../components/ReportSkeleton';
import { ReportLayout } from '../../components/reports/ReportLayout';
import { ReportPeriodNav } from '../../components/reports/ReportPeriodNav';
import { TopCategoriesAccordion } from '../../components/reports/TopCategoriesAccordion';

export const MonthlyReportPage: React.FC = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear] = useState(currentYear);
  const [selectedMonth] = useState(currentMonth);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(Currency.EUR);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  
  const { data: userCurrencies } = useUserCurrencies();
  const { data: report, isLoading, error, refetch } = useMonthlyReport(
    selectedYear.toString(), 
    selectedMonth.toString().padStart(2, '0'), 
    selectedCurrency
  );
  
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

  const monthlyPeriodRange = {
    from: `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`,
    to: `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate().toString().padStart(2, '0')}`,
  };
  
  // Handle empty state
  if (!report.has_data) {
    return (
      <ReportLayout>
        <ReportPeriodNav activePeriod="monthly" />

          {/* Empty State */}
          <section className="flex flex-col items-center justify-center py-20">
            <span className="material-symbols-outlined text-6xl text-secondary mb-4">calendar_month</span>
            <h2 className="text-xl font-bold text-primary mb-2">No expenses this month</h2>
            <p className="text-secondary text-center mb-6">There are no expenses recorded for this month</p>
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
      <ReportPeriodNav activePeriod="monthly" />

        {/* Hero Card (Total Spending) */}
        <section className="relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="font-label text-[10px] font-medium tracking-[0.2em] text-secondary uppercase py-4 block">
                Monthly Statement — {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })}
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
                      ? (report.daily_chart[selectedBarIndex]?.amount ?? 0)
                      : report.total,
                    selectedCurrency
                  ).replace(getCurrencySymbol(selectedCurrency), '')}
                </h2>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <span className={`material-symbols-outlined ${report.direction === 'up' ? 'text-error' : report.direction === 'down' ? 'text-primary' : 'text-secondary'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {report.direction === 'up' ? 'trending_up' : report.direction === 'down' ? 'trending_down' : 'trending_flat'}
                </span>
                <span className={`font-label text-sm font-semibold ${report.direction === 'up' ? 'text-error' : report.direction === 'down' ? 'text-primary' : 'text-secondary'}`}>
                  {report.direction === 'same' ? 'No change' : 
                   report.direction === 'up' ? `+${report.change_percent.toFixed(1)}% increase from last month` :
                   `-${report.change_percent.toFixed(1)}% decrease from last month`}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Primary Graph: Vertical Bar Heartbeat */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-bold font-headline text-primary">Spending This Month</h3>
            {selectedBarIndex !== null ? (
              <span className="text-xs text-secondary font-medium">
                Day {report.daily_chart[selectedBarIndex]?.day} — {formatCurrency(report.daily_chart[selectedBarIndex]?.amount ?? 0, selectedCurrency)}
              </span>
            ) : (
              <span className="text-label-sm text-secondary font-medium">
                {new Date(selectedYear, selectedMonth - 1, 1).toLocaleString('default', { month: 'short' })} {selectedYear}
              </span>
            )}
          </div>
          <div className="h-48 flex items-end justify-between gap-1 pt-4">
            {report.daily_chart.map((data, index) => {
              const maxAmount = Math.max(...report.daily_chart.map(d => d.amount), 1);
              const heightPercentage = (data.amount / maxAmount) * 100;
              const heightPx = heightPercentage === 0 ? 4 :
                               heightPercentage < 20 ? 32 :
                               heightPercentage < 40 ? 64 :
                               heightPercentage < 60 ? 96 :
                               heightPercentage < 80 ? 128 : 160;
              const isSelected = selectedBarIndex === index;

              return (
                <button
                  key={index}
                  onClick={() => setSelectedBarIndex(isSelected ? null : index)}
                  style={{ height: `${heightPx}px` }}
                  className={`flex-1 rounded-t-sm transition-all duration-200 focus:outline-none ${
                    isSelected
                      ? 'bg-primary shadow-md scale-x-110'
                      : 'bg-surface-container-highest hover:bg-primary/50'
                  }`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter text-secondary opacity-50 px-1">
            <span>Day 1</span>
            <span>Today</span>
            <span>Day {report.daily_chart.length}</span>
          </div>
        </section>

        {/* Insights */}
        <section className="mb-12">
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

        {/* Category Breakdown: Horizontal Ledger */}
        <TopCategoriesAccordion
          categories={report.top_categories}
          currency={selectedCurrency}
          periodRange={monthlyPeriodRange}
          className="mb-12"
          titleClassName="text-sm font-headline font-bold text-primary tracking-tight mb-3"
          itemClassName="py-3"
        />

        {/* Comparison Section */}
        <section className="space-y-3 pb-4">
          <h3 className="text-lg font-bold font-headline">Comparison</h3>
          <div className="flex gap-4">
            <div className="flex-1 p-4 bg-surface-container-low rounded-lg">
              <p className="text-[9px] font-label text-outline uppercase tracking-wider mb-1">Last Month</p>
              <p className="text-lg font-headline font-extrabold text-secondary opacity-60">{formatCurrency(report.previous_total, selectedCurrency)}</p>
            </div>
            <div className="flex-1 p-4 bg-surface-container-highest rounded-lg border-l-4 border-primary">
              <p className="text-[9px] font-label text-primary uppercase tracking-wider mb-1">This Month</p>
              <p className="text-lg font-headline font-extrabold text-primary">{formatCurrency(report.total, selectedCurrency)}</p>
            </div>
          </div>
      </section>
    </ReportLayout>
  );
};
