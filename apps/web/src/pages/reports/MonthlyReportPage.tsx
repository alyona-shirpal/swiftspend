import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Currency } from '@swiftspend/types';

export const MonthlyReportPage: React.FC = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const [selectedYear] = useState(currentYear);
  const [selectedMonth] = useState(currentMonth);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(Currency.EUR);

  // Mock data for the design
  const monthlyData = [
    { height: 'h-1/3' },
    { height: 'h-2/5' },
    { height: 'h-1/4' },
    { height: 'h-3/5' },
    { height: 'h-2/3' },
    { height: 'h-full', active: true },
    { height: 'h-1/2' },
    { height: 'h-3/4' },
    { height: 'h-2/5' },
    { height: 'h-1/2' },
    { height: 'h-1/3' },
    { height: 'h-1/5' },
    { height: 'h-1/2' },
    { height: 'h-2/3' },
  ];

  // Mock total amounts in different currencies
  const totalAmounts = {
    EUR: 3840.00,
    USD: 4185.60,
    UAH: 128000.00,
    ALL: 376320.00,
  };

  const currencyOptions = [Currency.EUR, Currency.USD, Currency.UAH, Currency.ALL];

  const uahSymbol = '₴';

  const currencyIcons = {
    EUR: 'euro',
    USD: 'attach_money',
    UAH: 'hryvnia',
    ALL: 'currency_lira',
  };

  const categoryData = [
    { name: 'Food', amount: 1240.00, percentage: 65, transactions: 12, icon: 'lunch_dining', color: 'bg-primary' },
    { name: 'Restaurants', amount: 890.50, percentage: 45, transactions: 48, icon: 'dining', color: 'bg-secondary' },
    { name: 'Home', amount: 750.00, percentage: 38, transactions: 3, icon: 'home', color: 'bg-on-tertiary-container' },
  ];

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen">
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
          <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDyw6z3nGg6Cb0uvUYLN8cyAXpjphIX1QY6gWRWz7_yn9ssuPWn-r5M-TH9oBG-RdOgjCAhKj2YWqEosIBIe7CUTXkgcQ8qkWght9qf35jEKzKBX5cveW5tHf8b4wvi0FA26rCpo87PIeKNkazqz-tc_UVtSMpnipFhpneoJ4hGCl5BMdga-qZRJUTDVUDdMBlRCi9XOSFPcp-7zlPSdb73-P4nRvxVKIjL2zvJ7ahKp8vE0i2S4fhwJz2SBqBYaGn5RxKPikuv4k" />
        </div>
      </header>

      <main className="pt-24 pb-28 px-6 max-w-md mx-auto">
        {/* Period Switcher (Segmented Control) */}
        <section className="mb-4">
          <div className="bg-surface-container-low p-1 flex rounded-lg">
            <button 
              onClick={() => navigate('/reports')}
              className="flex-1 py-2 text-[11px] font-semibold font-label tracking-widest text-slate-500"
            >
              DAILY
            </button>
            <button 
              className="flex-1 py-2 text-[11px] font-semibold font-label tracking-widest bg-surface-container-lowest text-primary shadow-sm rounded-md transition-all duration-300"
            >
              MONTHLY
            </button>
            <button 
              onClick={() => navigate('/reports/yearly')}
              className="flex-1 py-2 text-[11px] font-semibold font-label tracking-widest text-slate-500"
            >
              YEARLY
            </button>
          </div>
        </section>

        {/* Hero Card (Total Spending) */}
        <section className="relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="font-label text-[10px] font-medium tracking-[0.2em] text-secondary uppercase mb-2 block">
                Monthly Statement — {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })}
              </span>
              {/* Currency Selector */}
              <div className="flex rounded-lg bg-surface-container-low p-1 mb-4">
                {currencyOptions.map((currency) => (
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
                <span className={`text-[2.5rem] text-primary ${selectedCurrency === 'UAH' ? '' : 'material-symbols-outlined'}`}>
                  {selectedCurrency === 'UAH' ? uahSymbol : currencyIcons[selectedCurrency]}
                </span>
                <h2 className="font-headline text-[3.5rem] leading-none font-extrabold balance-text text-primary">
                  {totalAmounts[selectedCurrency].toFixed(2).replace('.', ',')}
                </h2>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
                  trending_up
                </span>
                <span className="font-label text-sm font-semibold text-error">
                  +5% increase from last month
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Primary Graph: Vertical Bar Heartbeat */}
        <section className="mb-12 space-y-6">
          <div className="flex justify-between items-end">
            <h3 className="text-sm font-headline font-bold text-primary tracking-tight">Spending This Month</h3>
            <span className="text-label-sm text-secondary font-medium">01 Oct - 31 Oct</span>
          </div>
          <div className="h-48 flex items-end justify-between gap-1.5 pt-4">
            {monthlyData.map((data, index) => (
              <div 
                key={index} 
                className={`flex-1 ${data.active ? 'bg-primary' : 'bg-surface-container-highest'} rounded-t-sm ${data.height}`}
              ></div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-tighter text-secondary opacity-50 px-1">
            <span>01 Oct</span>
            <span>Today</span>
            <span>31 Oct</span>
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
              <p className="text-white font-medium text-sm">Your utility bills were 15% lower this month compared to your yearly average</p>
            </div>
            <span className="material-symbols-outlined text-white/40">chevron_right</span>
          </div>
        </section>

        {/* Category Breakdown: Horizontal Ledger */}
        <section className="mb-12">
          <h3 className="text-sm font-headline font-bold text-primary tracking-tight mb-6">Top Categories Spending</h3>
          <div className="space-y-6">
            {categoryData.map((category, index) => (
              <div key={index} className="group">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface-container-low flex items-center justify-center rounded-lg">
                      <span className="material-symbols-outlined text-primary">{category.icon}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary tracking-tight">{category.name}</p>
                      <p className="text-[10px] text-on-surface-variant font-medium">{category.transactions} Transactions</p>
                    </div>
                  </div>
                  <p className="text-sm font-headline font-bold text-primary">€{category.amount.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div className={`h-full ${category.color} rounded-full`} style={{width: `${category.percentage}%`}}></div>
                  </div>
                  <span className="text-[10px] font-bold text-secondary">{category.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison Section */}
        <section className="space-y-4 pb-8">
          <h3 className="text-lg font-bold font-headline">Comparison</h3>
          <div className="flex gap-4">
            <div className="flex-1 p-4 bg-surface-container-low rounded-lg">
              <p className="text-[9px] font-label text-outline uppercase tracking-wider mb-1">September</p>
              <p className="text-lg font-headline font-extrabold text-secondary opacity-60">€3.650</p>
            </div>
            <div className="flex-1 p-4 bg-surface-container-highest rounded-lg border-l-4 border-primary">
              <p className="text-[9px] font-label text-primary uppercase tracking-wider mb-1">October</p>
              <p className="text-lg font-headline font-extrabold text-primary">€3.840</p>
            </div>
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
