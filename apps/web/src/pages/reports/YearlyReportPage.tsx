import React from 'react';
import { useYearlyReport } from '../../hooks/useReports';
import { CurrencyValue } from '../../components/currency/CurrencyValue';
import { Card } from '../../components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const YearlyReportPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { data: report, isLoading } = useYearlyReport(currentYear);

  const chartData = report?.monthlySpending.map(ms => ({
    month: ms.month.substring(0, 3).toUpperCase(),
    amount: ms.amount.EUR
  })) || [];

  return (
    <div className="space-y-12">
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-primary text-5xl font-extrabold tracking-tight mb-2">
              Annual <br />Retrospective.
            </h1>
            <p className="text-secondary font-body text-sm opacity-70 uppercase tracking-[0.3em] font-bold">
              FISCAL YEAR {currentYear}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-1 text-on-tertiary-container">Total Capital Burn</span>
            <CurrencyValue 
              amount={report?.totalAmount.EUR || 0} 
              amounts={report?.totalAmount}
              size="lg" 
              className="text-primary font-black"
            />
          </div>
        </div>
      </section>

      {/* Main Trend Chart */}
      <Card variant="lowest" className="h-[500px] p-8 border border-outline-variant/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <span className="font-headline font-black text-[200px] leading-none text-primary">{currentYear}</span>
        </div>
        
        <div className="relative z-10 h-full flex flex-col">
          <h3 className="font-headline text-lg font-bold text-primary uppercase tracking-widest mb-12">Spending Velocity</h3>
          
          <div className="flex-1 w-full">
            {isLoading ? (
              <div className="w-full h-full bg-surface-container-low animate-pulse rounded-lg"></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#000000" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </Card>

      {/* Annual Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {report?.categories.slice(0, 4).map((category) => (
          <Card key={category.categoryId} className="p-6 bg-white border border-outline-variant/10 group hover:bg-primary transition-all duration-300">
            <span className="material-symbols-outlined text-3xl mb-4 group-hover:text-white transition-colors" style={{ color: category.color }}>
              {category.icon}
            </span>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-secondary group-hover:text-white/60 mb-2 transition-colors">
              {category.name}
            </h4>
            <CurrencyValue 
              amount={category.totalAmount.EUR} 
              amounts={category.totalAmount}
              className="text-primary font-bold group-hover:text-white transition-colors"
            />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default YearlyReportPage;
