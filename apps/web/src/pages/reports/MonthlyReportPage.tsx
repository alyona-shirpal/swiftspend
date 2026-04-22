import React from 'react';
import { useMonthlyReport } from '../../hooks/useReports';
import { CurrencyValue } from '../../components/currency/CurrencyValue';
import { Card } from '../../components/ui/Card';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const MonthlyReportPage: React.FC = () => {
  const now = new Date();
  const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const currentMonth = monthNames[now.getMonth()];
  const currentYear = now.getFullYear();

  const { data: report, isLoading } = useMonthlyReport(currentMonth, currentYear);

  const chartData = report?.dailySpending.map(ds => ({
    date: ds.date.split('-')[2], // get day only
    amount: ds.amount.EUR
  })) || [];

  return (
    <div className="space-y-12">
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-primary text-5xl font-extrabold tracking-tight mb-2">
              Monthly <br />Perspective.
            </h1>
            <p className="text-secondary font-body text-sm opacity-70 uppercase tracking-widest font-bold">
              {currentMonth} {currentYear}
            </p>
          </div>
          <div className="text-right space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-1">Volume Total</span>
              <CurrencyValue 
                amount={report?.totalAmount.EUR || 0} 
                amounts={report?.totalAmount}
                size="lg" 
              />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-1">Daily Average</span>
              <CurrencyValue 
                amount={report?.dailyAverage.EUR || 0} 
                amounts={report?.dailyAverage}
                className="opacity-60"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bar Chart Section */}
      <Card variant="lowest" className="h-[400px] p-8 border border-outline-variant/10">
        <h3 className="font-headline text-lg font-bold text-primary uppercase tracking-widest mb-10">Spending distribution</h3>
        <div className="h-[300px] w-full">
          {isLoading ? (
            <div className="w-full h-full bg-surface-container-low animate-pulse rounded-lg"></div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} 
                />
                <Bar 
                  dataKey="amount" 
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.amount > (report?.dailyAverage.EUR || 0) ? '#000000' : '#47607e'} 
                      opacity={entry.amount > (report?.dailyAverage.EUR || 0) ? 1 : 0.4}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Category Summary */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {report?.categories.map((category) => (
          <Card key={category.categoryId} variant="container" className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-white shadow-sm" style={{ color: category.color }}>
              <span className="material-symbols-outlined">{category.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-secondary opacity-60 m-0">{category.name}</p>
              <CurrencyValue 
                amount={category.totalAmount.EUR} 
                amounts={category.totalAmount}
                className="font-bold text-primary"
              />
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
};

export default MonthlyReportPage;
