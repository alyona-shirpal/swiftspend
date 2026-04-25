import React from 'react';
import { MonthlyHero } from '../../components/dashboard/MonthlyHero';
import { InstantLogging } from '../../components/dashboard/InstantLogging';
import { RecentSpend } from '../../components/dashboard/RecentSpend';

export const DashboardPage: React.FC = () => {
  return (
    <div className="bg-surface text-on-surface font-body min-h-screen pb-32">
      {/* TopAppBar */}
      <header className="bg-[#f7f9fb] dark:bg-slate-950 flex justify-between items-center px-6 py-4 w-full docked full-width top-0 sticky z-40">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-widest">
            SwiftSpend
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden">
          <img
            alt="User profile"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9sw_PC6URaEqEck0XMcn2-3_nsW7_4bLwCSGU8IbOhgwpldmwisHBKt2g46fyqqDoYiWnfK-vWdyJhlsCaKjQ_hwAzbB7xOFZoJ26iSjtu4bnMdvm9--L7gjmQWXylDNG_LokkDP0YGAQBc2Jm4vfw3UAoq_xkW0IqdsMp4w5Tl65rdQfk0W8tr4RMMiv44GmuPF-UxPnr2M230y-v6HgVyLqgep0e0-iTNawX5zTp-6kd7yC2uq3E_xw784DMBHOOVr0UsXmYus"
          />
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-8 space-y-12">
        <MonthlyHero />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Instant Logging block */}
          <aside className="lg:col-span-5 order-1 lg:order-2">
            <InstantLogging />
          </aside>

          {/* Recent Spend */}
          <RecentSpend />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 py-3 pb-safe bg-[#f2f4f6] dark:bg-slate-800 border-t border-outline-variant/10">
        <button className="flex flex-col items-center justify-center text-black dark:text-white py-1">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            dashboard
          </span>
          <span className="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">
            Home
          </span>
        </button>

        {/* Large Elevated FAB button in center */}
        <div className="relative -top-6">
          <button 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              (document.querySelector('input[type="number"]') as HTMLInputElement)?.focus();
            }}
            className="w-16 h-16 bg-primary dark:bg-white text-on-primary dark:text-black rounded-full shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] dark:shadow-[0_10px_25px_-5px_rgba(255,255,255,0.2)] flex items-center justify-center active:scale-90 transition-transform"
          >
            <span className="material-symbols-outlined text-3xl font-bold">add</span>
          </button>
        </div>

        <button className="flex flex-col items-center justify-center text-[#47607e] dark:text-slate-500 opacity-60 hover:opacity-100 transition-opacity py-1">
          <span className="material-symbols-outlined">insert_chart</span>
          <span className="font-inter text-[10px] font-medium tracking-wide uppercase mt-1">
            Reports
          </span>
        </button>
      </nav>
    </div>
  );
};
