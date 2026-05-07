import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Currency } from '@swiftspend/types';
import { useDailyReport } from '../../hooks/useReports';
import { useUserCurrencies } from '../../hooks/useUserCurrencies';
import { formatCurrency, getCurrencyIcon, getCurrencySymbol } from '../../utils/formatCurrency';
import { ReportSkeleton } from '../../components/ReportSkeleton';

export const DailyReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]!);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(Currency.EUR);
  
  const { data: userCurrencies } = useUserCurrencies();
  const { data: report, isLoading, error, refetch } = useDailyReport(selectedDate, selectedCurrency);
  
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
                className="flex-1 py-2 text-sm font-semibold rounded-md bg-white shadow-sm text-primary"
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
                className="flex-1 py-2 text-sm font-medium text-secondary"
              >
                Yearly
              </button>
            </div>
          </div>

          {/* Empty State */}
          <section className="flex flex-col items-center justify-center py-20">
            <span className="material-symbols-outlined text-6xl text-secondary mb-4">receipt_long</span>
            <h2 className="text-xl font-bold text-primary mb-2">No expenses yet</h2>
            <p className="text-secondary text-center mb-6">There are no expenses recorded for this day</p>
            <button 
              onClick={() => navigate('/dashboard')}
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
              className="flex-1 py-2 text-sm font-semibold rounded-md bg-white shadow-sm text-primary"
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
              className="flex-1 py-2 text-sm font-medium text-secondary"
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
                <h2 className="font-headline text-[3.5rem] leading-none font-extrabold balance-text text-primary">
                  {formatCurrency(report.total, selectedCurrency).replace(getCurrencySymbol(selectedCurrency), '')}
                </h2>
              </div>
              <div className="flex items-center gap-2 mt-4">
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
        <section className="space-y-4">
          <h3 className="text-lg font-bold font-headline">Spending This Week</h3>
          <div className="bg-surface-container-lowest p-6 rounded-xl space-y-6">
            <div className="flex items-end justify-between h-40 px-2">
              {report.weekly_chart.map((data, index) => {
                const maxAmount = Math.max(...report.weekly_chart.map(d => d.amount), 1);
                const heightPercentage = (data.amount / maxAmount) * 100;
                const heightClass = heightPercentage === 0 ? 'h-2' : 
                                 heightPercentage < 20 ? 'h-8' :
                                 heightPercentage < 40 ? 'h-16' :
                                 heightPercentage < 60 ? 'h-24' :
                                 heightPercentage < 80 ? 'h-32' : 'h-40';
                
                return (
                  <div key={index} className="flex flex-col items-center gap-2 group">
                    <div className={`w-2 ${data.is_today ? 'bg-primary' : 'bg-surface-container-high'} rounded-full ${heightClass} ${!data.is_today ? 'group-hover:bg-primary transition-all' : ''}`}></div>
                    <span className={`text-[10px] font-medium ${data.is_today ? 'text-primary font-bold' : 'text-secondary'}`}>{data.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Insights */}
        <section className="mb-8">
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
        <section className="bg-surface-container-lowest rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-container-low flex justify-between items-center">
            <h3 className="text-lg font-bold font-headline text-primary">Top Categories Spending</h3>
            <span className="material-symbols-outlined text-secondary cursor-pointer">filter_list</span>
          </div>
          <div className="divide-y divide-surface-container-low">
            {report.top_categories.map((category, index) => (
              <div key={index} className="p-6 flex items-center hover:bg-surface-container-low transition-colors group">
                <div className="w-12 h-12 bg-surface-container-high rounded flex items-center justify-center mr-4 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">{category.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-sm text-primary">{category.name}</h4>
                    <span className="font-bold text-primary">{formatCurrency(category.total, selectedCurrency)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div className={`h-full bg-primary w-[${category.percentage}%]`}></div>
                    </div>
                    <span className="text-[10px] font-bold text-secondary">{category.percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
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
