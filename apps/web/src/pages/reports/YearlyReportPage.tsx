import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Currency } from '@swiftspend/types';

export const YearlyReportPage: React.FC = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  
  const [selectedYear] = useState(currentYear);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(Currency.EUR);

  // Mock data for the design
  const monthlyData = [
    { height: 'h-[30%]' },
    { height: 'h-[45%]' },
    { height: 'h-[60%]' },
    { height: 'h-[40%]' },
    { height: 'h-[75%]' },
    { height: 'h-[55%]' },
    { height: 'h-[65%]' },
    { height: 'h-[95%]', active: true }, // August peak
    { height: 'h-[50%]' },
    { height: 'h-[45%]' },
    { height: 'h-[80%]' },
    { height: 'h-[70%]' },
  ];

  // Mock total amounts in different currencies
  const totalAmounts = {
    EUR: 42156.00,
    USD: 45900.48,
    UAH: 1405200.00,
    ALL: 4131328.00,
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
    { name: 'Home', amount: 15200, percentage: 36, icon: 'home', color: 'bg-primary' },
    { name: 'Travel', amount: 9840, percentage: 23, icon: 'flight', color: 'bg-secondary' },
    { name: 'Restaurants', amount: 6420, percentage: 15, icon: 'dining', color: 'bg-on-tertiary-container' },
  ];

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
          <img alt="Profile Photo" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7FiCYUFQl6ybYh2V-HzOGE9LadnVdNGawmQIbCCwxxoIflANxTce7Y-3kQzwgcImVVGwc1RH3APUnak4cIiqr1sN7VjrHqm8JtB2IhiLAhoWt4-vImQedZ6P8SLGcu7mKF0E8hSAN4UnPcgOYiqPmXt-ozTrZJkyVVJSk_Ze92F1_mAOcy8m5rYbUBrsdML66Hof842df1ULB51m5TVHCijXESs2LBIZ84-ewjWwFE7ebp6Zu-BQ2UzjSdKE9vPBENB93m2dRIxk" />
        </div>
      </header>

      <main className="pt-24 pb-28 px-6 max-w-md mx-auto">
        {/* Segmented Control */}
        <nav className="flex p-1 bg-surface-container-low rounded-lg">
          <button 
            onClick={() => navigate('/reports')}
            className="flex-1 py-2 text-sm font-medium text-secondary transition-all"
          >
            Daily
          </button>
          <button 
            onClick={() => navigate('/reports/monthly')}
            className="flex-1 py-2 text-sm font-medium text-secondary transition-all"
          >
            Monthly
          </button>
          <button 
            className="flex-1 py-2 text-sm font-bold text-primary bg-surface-container-lowest rounded-md shadow-sm transition-all"
          >
            Yearly
          </button>
        </nav>

        {/* Hero Card (Total Spending) */}
        <section className="relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="font-label text-[10px] font-medium tracking-[0.2em] text-secondary uppercase mb-2 block">
                Yearly Statement — {selectedYear}
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
                <span className="material-symbols-outlined text-on-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                  trending_up
                </span>
                <span className="font-label text-sm font-semibold text-on-tertiary-container">
                  +8% increase from last year
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Primary Graph: Spending Trend */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-bold font-headline text-primary">Spending Trend</h3>
            <span className="text-label-sm text-secondary font-medium">Jan — Dec 2023</span>
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
            <p className="text-white font-medium text-sm">Top spending month was August</p>
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
            {categoryData.map((category, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">{category.icon}</span>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-bold text-primary">{category.name}</h4>
                    <span className="text-sm font-extrabold text-primary">EUR {category.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div className={`h-full ${category.color} rounded-full`} style={{width: `${category.percentage}%`}}></div>
                    </div>
                    <span className="text-[10px] font-bold text-secondary">{category.percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison Section */}
        <section className="space-y-4 pb-8">
          <h3 className="text-lg font-bold font-headline">Comparison</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-surface-container-low rounded-lg space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">2023 Total</span>
              <p className="text-xl font-extrabold text-primary">€42.156</p>
            </div>
            <div className="p-6 bg-surface-container-low rounded-lg space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">2022 Total</span>
              <p className="text-xl font-extrabold text-secondary opacity-60">€39.033</p>
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
