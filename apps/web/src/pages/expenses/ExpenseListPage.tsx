import React from 'react';
import { useExpenses, useDeleteExpense } from '../../hooks/useExpenses';
import { useFilterStore } from '../../store/filterStore';
import { CurrencyValue } from '../../components/currency/CurrencyValue';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';

const ExpenseListPage: React.FC = () => {
  const { search, setFilters, dateFrom, dateTo } = useFilterStore();
  const { data: expenses, isLoading } = useExpenses({ search, dateFrom, dateTo });
  const { mutate: deleteExpense } = useDeleteExpense();

  return (
    <div className="space-y-10">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-primary text-5xl font-extrabold tracking-tight mb-4">
            Digital <br />Ledger.
          </h1>
          <p className="text-secondary font-body text-sm max-w-sm opacity-70">
            A comprehensive record of your financial movements and spending history.
          </p>
        </div>

        <div className="w-full md:w-80 relative group">
          <Input 
            placeholder="Search transactions..." 
            value={search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="pl-10 h-14"
          />
          <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-secondary opacity-40 group-focus-within:opacity-100 transition-opacity">
            search
          </span>
        </div>
      </section>

      {/* Filter Chips */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        <button className="px-4 py-2 bg-primary text-on-primary rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
          All Time
        </button>
        <button className="px-4 py-2 bg-surface-container-high text-secondary rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
          High Value ({'>'} €100)
        </button>
        <button className="px-4 py-2 bg-surface-container-high text-secondary rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
          Essential
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-20 w-full bg-surface-container-low animate-pulse rounded-xl"></div>
          ))
        ) : expenses && expenses.length > 0 ? (
          expenses.map((expense) => (
            <Card 
              key={expense.id} 
              variant="lowest" 
              className="flex items-center justify-between p-4 group hover:shadow-md transition-all border border-outline-variant/10"
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${expense.category?.color}20`, color: expense.category?.color }}
                >
                  <span className="material-symbols-outlined">{expense.category?.icon || 'receipt_long'}</span>
                </div>
                <div>
                  <h4 className="font-body font-bold text-primary">
                    {expense.description || expense.category?.name}
                  </h4>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-secondary opacity-60">
                    {format(new Date(expense.date), 'MMM dd, yyyy')} • {expense.category?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <CurrencyValue 
                    amount={expense.amount} 
                    currency={expense.currency} 
                    amounts={expense.amounts}
                    className="font-headline font-bold text-lg"
                  />
                </div>
                <button 
                  onClick={() => deleteExpense(expense.id)}
                  className="p-2 text-secondary opacity-0 group-hover:opacity-100 hover:text-error transition-all"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </Card>
          ))
        ) : (
          <div className="py-20 text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-outline-variant">search_off</span>
            <p className="text-secondary font-body">No matching transactions found in your records.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseListPage;
