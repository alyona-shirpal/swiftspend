import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Currency } from '@swiftspend/types';
import { useYearlyReport } from '../../hooks/useReports';
import { useUserCurrencies } from '../../hooks/useUserCurrencies';
import { formatCurrency, getCurrencyIcon, getCurrencySymbol } from '../../utils/formatCurrency';
import { ReportSkeleton } from '../../components/ReportSkeleton';

export const YearlyReportPage: React.FC = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  
  const [selectedYear] = useState(currentYear);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(Currency.EUR);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  
  const { data: userCurrencies } = useUserCurrencies();
  const { data: report, isLoading, error, refetch } = useYearlyReport(selectedYear.toString(), selectedCurrency);
  
  const currencyOptions = userCurrencies?.currencies?.map((uc) => uc.currency as Currency) || [Currency.EUR];
  
  if (isLoading) {
    return <ReportSkeleton />;
  }
  
  if (error) {
    return (
      <div className="bg-surface text-on-surface min-h-screen pb-24 flex items-center justify-center">
        <div className="text-center">
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
      </div>
    );
  }
  
  if (!report) {
    return <ReportSkeleton />;
  }
  
  // Handle empty state
  if (!report.has_data) {
    return (
      <div className="bg-surface text-on-surface min-h-screen pb-24">
        {/* Top Navigation Anchor */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#f7f9fb] flex justify-between items-center w-full px-6 py-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-full hover:bg-surface-container-low/50 transition-colors"
            >
              <span className="material-symbols-outlined text-black">arrow_back</span>
            </button>
            <h1 className="text-xl font-extrabold font-headline tracking-tight text-black">Report</h1>
          </div>
          <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
            <img alt="Profile Photo" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAj8DSZ2A0tz_RU6XlMGUtdnNqziN1kzcaYHv6alF6DcmUrZH4-keZkJUh2zDdBEBKsmp8yALR1VYZpst_CMOX_RN6nE8p0_dOa-EnqBo-04k6fqXs69vRp_oU2Pj0bn4xer5FijJo-NpLiWeuGRgt67VcF_Nbztdn_G7pbwV05SvJhzIsr9RpSpuBEEwJlWBOn7You-cVWNleveUy_tV7I2zm2GKjUfBbooMgIcfA72m2Ra-6ClGGj2rXkUhtdOBiM8Jcj9LGAPYs" />
          </div>
        </header>

        <main className="pt-14 pb-28 px-6 max-w-md mx-auto">
          {/* Segmented Control */}
          <div className="pt-4">
            <div className="bg-surface-container-low p-1 flex rounded-lg">
              <button 
                onClick={() => navigate('/reports')}
                className="flex-1 py-2 text-sm font-medium text-secondary"
              >
                Daily
              </button>
              <button 
                onClick={() => navigate('/reports/monthly')}
                className="flex-1 py-2 text-sm font-medium text-secondary"
              >
                Monthly
              </button>
              <button 
                onClick={() => navigate('/reports/yearly')}
                className="flex-1 py-2 text-sm font-semibold rounded-md bg-white shadow-sm text-primary"
              >
                Yearly
              </button>
            </div>
          </div>

          {/* Empty State */}
          <section className="flex flex-col items-center justify-center py-20">
            <span className="material-symbols-outlined text-6xl text-secondary mb-4">calendar_year</span>
            <h2 className="text-xl font-bold text-primary mb-2">No expenses this year</h2>
            <p className="text-secondary text-center mb-6">There are no expenses recorded for this year</p>
            <button 
              onClick={() => navigate('/expenses/new')}
              className="px-6 py-3 bg-primary text-on-primary rounded-lg font-medium"
            >
              Add Expense
            </button>
          </section>
        </main>
      </div>
    );
  }


  return (
    <div className="bg-surface text-on-surface font-body antialiased pb-24">
      {/* Top Navigation Anchor */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f7f9fb] flex justify-between items-center w-full px-6 py-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full hover:bg-surface-container-low/50 transition-colors"
          >
            <span className="material-symbols-outlined text-black">arrow_back</span>
          </button>
          <h1 className="text-xl font-extrabold font-headline tracking-tight text-black">Report</h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
          <img alt="Profile Photo" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAj8DSZ2A0tz_RU6XlMGUtdnNqziN1kzcaYHv6alF6DcmUrZH4-keZkJUh2zDdBEBKsmp8yALR1VYZpst_CMOX_RN6nE8p0_dOa-EnqBo-04k6fqXs69vRp_oU2Pj0bn4xer5FijJo-NpLiWeuGRgt67VcF_Nbztdn_G7pbwV05SvJhzIsr9RpSpuBEEwJlWBOn7You-cVWNleveUy_tV7I2zm2GKjUfBbooMgIcfA72m2Ra-6ClGGj2rXkUhtdOBiM8Jcj9LGAPYs" />
        </div>
      </header>

      <main className="pt-14 pb-28 px-6 max-w-md mx-auto">
        {/* Segmented Control */}
        <div className="pt-4">
          <div className="bg-surface-container-low p-1 flex rounded-lg">
            <button 
              onClick={() => navigate('/reports')}
              className="flex-1 py-2 text-sm font-medium text-secondary"
            >
              Daily
            </button>
            <button 
              onClick={() => navigate('/reports/monthly')}
              className="flex-1 py-2 text-sm font-medium text-secondary"
            >
              Monthly
            </button>
            <button 
              onClick={() => navigate('/reports/yearly')}
              className="flex-1 py-2 text-sm font-semibold rounded-md bg-white shadow-sm text-primary"
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Hero Card (Total Spending) */}
        <section className="relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="font-label text-[10px] font-medium tracking-[0.2em] text-secondary uppercase py-4 block">
                Yearly Statement — {selectedYear}
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
                      ? (report.monthly_chart[selectedBarIndex]?.amount ?? 0)
                      : report.total,
                    selectedCurrency
                  ).replace(getCurrencySymbol(selectedCurrency), '')}
                </h2>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <span className={`material-symbols-outlined ${report.direction === 'up' ? 'text-on-tertiary-container' : report.direction === 'down' ? 'text-primary' : 'text-secondary'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                  {report.direction === 'up' ? 'trending_up' : report.direction === 'down' ? 'trending_down' : 'trending_flat'}
                </span>
                <span className={`font-label text-sm font-semibold ${report.direction === 'up' ? 'text-on-tertiary-container' : report.direction === 'down' ? 'text-primary' : 'text-secondary'}`}>
                  {report.direction === 'same' ? 'No change' : 
                   report.direction === 'up' ? `+${report.change_percent.toFixed(1)}% increase from last year` :
                   `-${report.change_percent.toFixed(1)}% decrease from last year`}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Primary Graph: Spending Trend */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-bold font-headline text-primary">Spending Trend</h3>
            {selectedBarIndex !== null ? (
              <span className="text-xs text-secondary font-medium">
                {report.monthly_chart[selectedBarIndex]?.month} — {formatCurrency(report.monthly_chart[selectedBarIndex]?.amount ?? 0, selectedCurrency)}
              </span>
            ) : (
              <span className="text-label-sm text-secondary font-medium">Jan — Dec {selectedYear}</span>
            )}
          </div>
          <div className="h-48 flex items-end justify-between gap-1.5 pt-4">
            {report.monthly_chart.map((data, index) => {
              const maxAmount = Math.max(...report.monthly_chart.map(d => d.amount), 1);
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
                  title={`${data.month}: ${formatCurrency(data.amount, selectedCurrency)}`}
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
            <span>Jan</span>
            <span>Apr</span>
            <span>Aug</span>
            <span>Dec</span>
          </div>
        </section>

        {/* Insights */}
        <section className="p-5 bg-primary-container rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-on-tertiary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-white" style={{fontVariationSettings: "'FILL' 1"}}>lightbulb</span>
          </div>
          <div className="flex-1">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest opacity-60">Insights</h4>
            <p className="text-white font-medium text-sm">{report.insight}</p>
          </div>
          <span className="material-symbols-outlined text-white/40">chevron_right</span>
        </section>

        {/* Category Breakdown */}
        <section className="bg-surface-container-lowest rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-container-low flex justify-between items-center">
            <h3 className="text-lg font-bold font-headline text-primary">Top Categories Spending</h3>
            <span className="material-symbols-outlined text-secondary cursor-pointer">filter_list</span>
          </div>
          <div className="divide-y divide-surface-container-low space-y-6">
            {report.top_categories.map((category, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">{category.icon}</span>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-bold text-primary">{category.name}</h4>
                    <span className="text-sm font-extrabold text-primary">{formatCurrency(category.total, selectedCurrency)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{width: `${category.percentage}%`}}></div>
                    </div>
                    <span className="text-[10px] font-bold text-secondary">{category.percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison Section */}
        <section className="space-y-4 mb-12">
          <h3 className="text-lg font-bold font-headline">Comparison</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-surface-container-low rounded-lg space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">{selectedYear - 1} Total</span>
              <p className="text-xl font-extrabold text-secondary">{formatCurrency(report.previous_total, selectedCurrency)}</p>
            </div>
            <div className="p-6 bg-surface-container-low rounded-lg space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{selectedYear} Total</span>
              <p className="text-xl font-extrabold text-primary">{formatCurrency(report.total, selectedCurrency)}</p>
            </div>
          </div>
          {/* Trend Micro-Graph (Visual Heartbeat) */}
          <div className="h-16 w-full opacity-30 mt-4 overflow-hidden relative">
            <svg className="w-full h-full preserve-3d" preserveAspectRatio="none" viewBox="0 0 100 20">
              <path d="M0 15 Q 10 10 20 12 T 40 8 T 60 14 T 80 5 T 100 10" fill="none" stroke="#009668" strokeWidth="1.5"></path>
            </svg>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 py-3 pb-safe bg-[#f2f4f6] border-t border-outline-variant/10">
        <a className="flex flex-col items-center justify-center text-black py-1" href="#" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>dashboard</span>
          <span className="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Home</span>
        </a>
        {/* Large Elevated FAB button in center */}
        <div className="relative -top-6">
          <button className="w-16 h-16 bg-primary text-on-primary rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] flex items-center justify-center active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-3xl font-bold">add</span>
          </button>
        </div>
        <a className="flex flex-col items-center justify-center text-black py-1" href="#" onClick={(e) => { e.preventDefault(); }}>
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>insert_chart</span>
          <span className="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">Reports</span>
        </a>
      </nav>
    </div>
  );
};
