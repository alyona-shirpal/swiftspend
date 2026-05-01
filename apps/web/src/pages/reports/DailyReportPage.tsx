import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Currency } from '@swiftspend/types';

export const DailyReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(Currency.EUR);

  // Mock data for the design
  const weeklyData = [
    { day: 'M', amount: 48, height: 'h-12' },
    { day: 'T', amount: 85, height: 'h-24' },
    { day: 'W', amount: 62, height: 'h-16' },
    { day: 'T', amount: 120, height: 'h-32' },
    { day: 'F', amount: 142, height: 'h-28', active: true },
    { day: 'S', amount: 35, height: 'h-14' },
    { day: 'S', amount: 78, height: 'h-20' },
  ];

  // Mock total amounts in different currencies
  const totalAmounts = {
    EUR: 142.50,
    USD: 155.80,
    UAH: 4750.00,
    ALL: 13980.00,
  };

  const currencyOptions = [Currency.EUR, Currency.USD, Currency.UAH, Currency.ALL];
  const currencyIcons = {
    EUR: 'euro',
    USD: 'attach_money',
    UAH: 'hryvnia',
    ALL: 'currency_lira',
  };

  const uahSymbol = '₴';

  const categoryData = [
    { name: 'Food', amount: 49.88, percentage: 35, icon: 'restaurant', color: 'bg-primary' },
    { name: 'Home', amount: 28.50, percentage: 20, icon: 'home', color: 'bg-secondary' },
    { name: 'Travel', amount: 32.10, percentage: 22, icon: 'flight', color: 'bg-on-tertiary-container' },
    { name: 'Health', amount: 15.02, percentage: 10, icon: 'fitness_center', color: 'bg-outline' },
    { name: 'Beauty', amount: 8.50, percentage: 6, icon: 'face', color: 'bg-secondary-container' },
    { name: 'Clothing', amount: 5.20, percentage: 4, icon: 'checkroom', color: 'bg-on-surface-variant' },
    { name: 'Childcare', amount: 3.30, percentage: 3, icon: 'child_care', color: 'bg-on-tertiary-fixed-variant' },
  ];

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

      <main className="pt-24 pb-28 px-6 max-w-md mx-auto">
        {/* Segmented Control */}
        <div className="pt-4">
          <div className="flex bg-surface-container-low p-1 rounded-lg">
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
              <span className="font-label text-[10px] font-medium tracking-[0.2em] text-secondary uppercase mb-2 block">
                Daily Statement — {new Date(selectedDate!).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
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
                  {selectedCurrency === 'UAH'? uahSymbol : currencyIcons[selectedCurrency]}
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
                  +12% increase from yesterday
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
              {weeklyData.map((data, index) => (
                <div key={index} className="flex flex-col items-center gap-2 group">
                  <div className={`w-2 ${data.active ? 'bg-primary' : 'bg-surface-container-high'} rounded-full ${data.height} ${!data.active ? 'group-hover:bg-primary transition-all' : ''}`}></div>
                  <span className={`text-[10px] font-medium ${data.active ? 'text-primary font-bold' : 'text-secondary'}`}>{data.day}</span>
                </div>
              ))}
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
              <p className="text-white font-medium text-sm">Today's spending is 12% higher than your daily average</p>
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
            {categoryData.map((category, index) => (
              <div key={index} className="p-6 flex items-center hover:bg-surface-container-low transition-colors group">
                <div className="w-12 h-12 bg-surface-container-high rounded flex items-center justify-center mr-4 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">{category.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-sm text-primary">{category.name}</h4>
                    <span className="font-bold text-primary">€{category.amount.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                      <div className={`h-full ${category.color} w-[${category.percentage}%]`}></div>
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
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-container-low hover:bg-surface-container-low transition-colors group">
              <p className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-2">Previous Day</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-extrabold font-headline text-primary">€120,00</p>
              </div>
              <div className="mt-3 flex items-center gap-1">
                <div className="h-1 flex-1 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-[85%]"></div>
                </div>
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-surface-container-low hover:bg-surface-container-low transition-colors group">
              <p className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-2">Remaining Budget</p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-extrabold font-headline text-on-tertiary-container">€257,50</p>
              </div>
              <div className="mt-3 flex items-center gap-1">
                <div className="h-1 flex-1 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-on-tertiary-container w-[65%]"></div>
                </div>
              </div>
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
