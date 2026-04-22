import React from 'react';
import { useRecentExpenses } from '../../hooks/useExpenses';
import { CurrencyValue } from '../../components/currency/CurrencyValue';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const DashboardPage: React.FC = () => {
  const { data: recentExpenses, isLoading } = useRecentExpenses();

  // Mock total for the monthly statement
  const totalMonthly = 4822.50;

  return (
    <div className="space-y-12">
      {/* Hero Section: Total Expenses */}
      <section className="relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="font-label text-[10px] font-medium tracking-[0.2em] text-secondary uppercase mb-2 block">
              Monthly Statement — {format(new Date(), 'MMMM')}
            </span>
            <CurrencyValue 
              amount={totalMonthly} 
              size="xl" 
              className="text-primary"
            />
            <div className="flex items-center gap-2 mt-4">
              <span className="material-symbols-outlined text-on-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                trending_down
              </span>
              <span className="font-label text-sm font-semibold text-on-tertiary-container">
                12.5% decrease from last month
              </span>
            </div>
          </div>

          {/* Sparkline Trend Card */}
          <Card variant="lowest" className="w-full md:w-64 p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="font-label text-[10px] font-bold text-secondary uppercase tracking-widest">
                Spending Velocity (EUR)
              </span>
            </div>
            <div className="h-16 flex items-end gap-1">
              {[20, 45, 30, 60, 85, 100].map((height, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex-1 rounded-sm",
                    i === 5 ? "bg-on-tertiary-container" : i === 4 ? "bg-tertiary-fixed-dim" : "bg-surface-container-high"
                  )} 
                  style={{ height: `${height}%` }}
                ></div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Recent Transactions: Left Column */}
        <section className="lg:col-span-7 space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="font-headline text-2xl font-bold tracking-tight text-primary">
              The Daily SPEND
            </h3>
            <Link to="/expenses" className="font-label text-xs font-bold text-secondary hover:underline uppercase tracking-widest">
              View All
            </Link>
          </div>

          <div className="space-y-6">
            {isLoading ? (
              // Simple skeleton
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-12 w-full bg-surface-container-low animate-pulse rounded-lg"></div>
              ))
            ) : recentExpenses && recentExpenses.length > 0 ? (
              recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 flex items-center justify-center bg-surface-container-low rounded-lg group-hover:bg-surface-container-highest transition-colors">
                      <span className="material-symbols-outlined text-primary">
                        {expense.category?.icon || 'receipt_long'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-body text-md font-semibold text-primary">
                        {expense.description || expense.category?.name || 'Expense'}
                      </h4>
                      <p className="font-label text-xs text-secondary opacity-70">
                        {expense.category?.name || 'Other'} • {format(new Date(expense.date), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <CurrencyValue 
                      amount={expense.amount} 
                      currency={expense.currency} 
                      amounts={expense.amounts}
                      className="font-body font-bold text-primary"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-secondary opacity-50 font-body text-sm">
                No recent expenses found.
              </div>
            )}
          </div>
        </section>

        {/* Quick Entry: Right Column */}
        <aside className="lg:col-span-5">
          <Card variant="lowest" className="p-8 sticky top-24 border border-outline-variant/10">
            <h3 className="font-headline text-xl font-bold mb-8 text-primary">
              Instant Logging
            </h3>
            <form className="space-y-8">
              <div className="space-y-2">
                <label className="font-label text-xs font-bold text-secondary uppercase tracking-widest block">
                  Transaction Amount
                </label>
                <div className="flex items-center border-b-2 border-surface-container-highest focus-within:border-on-tertiary-container transition-colors py-2 relative">
                  <select className="bg-transparent border-none focus:ring-0 text-sm font-bold text-secondary uppercase tracking-widest cursor-pointer pl-0 pr-8 py-0 appearance-none">
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="ALL">ALL</option>
                    <option value="UAH">UAH</option>
                  </select>
                  <input 
                    className="w-full bg-transparent border-none focus:ring-0 text-3xl font-headline font-bold text-primary" 
                    placeholder="0"
                    type="number" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label text-xs font-bold text-secondary uppercase tracking-widest block">
                  Reference / Note
                </label>
                <input 
                  className="w-full bg-transparent border-b-2 border-surface-container-highest focus:border-on-tertiary-container focus:ring-0 transition-all py-3 text-body font-medium" 
                  placeholder="What was this for?" 
                  type="text" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="surface" className="gap-2">
                  <span className="material-symbols-outlined text-sm">category</span>
                  Category
                </Button>
                <Button variant="surface" className="gap-2">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  Today
                </Button>
              </div>

              <Button size="xl" className="w-full py-5 shadow-lg">
                Log Expense
              </Button>
            </form>
          </Card>
        </aside>
      </div>

      {/* FAB for Mobile */}
      <Link 
        to="/expenses/new" 
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-xl flex items-center justify-center z-50 active:scale-90 transition-transform"
      >
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'wght' 600" }}>
          add
        </span>
      </Link>
    </div>
  );
};

// Helper for conditional classes (redundant if use cn but good for brevity here)
const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default DashboardPage;
