import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MonthlyHero } from '../../components/dashboard/MonthlyHero';
import { InstantLogging } from '../../components/dashboard/InstantLogging';
import { RecentSpend } from '../../components/dashboard/RecentSpend';
import { useAuth } from '../../hooks/useAuth';

export const DashboardPage: React.FC = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen pb-32">
      {/* TopAppBar */}
      <header className="bg-[#f7f9fb] dark:bg-slate-950 flex justify-between items-center px-6 py-4 w-full docked full-width top-0 sticky z-40">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-widest">
            SwiftSpend
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-full border border-outline-variant/30 px-4 py-2 text-xs font-bold uppercase tracking-widest text-secondary hover:bg-surface-container-low transition-colors"
        >
          Sign Out
        </button>
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
            onClick={() => navigate('/expenses/new')}
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
