import React from 'react';
import { useDailyReport } from '../../hooks/useReports';
import { CurrencyValue } from '../../components/currency/CurrencyValue';
import { Card } from '../../components/ui/Card';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const DailyReportPage: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const { data: report, isLoading } = useDailyReport(today);

  const chartData = report?.categories.map(c => ({
    name: c.name,
    value: c.totalAmount.EUR, // Always use EUR for chart distribution
    color: c.color
  })) || [];

  return (
    <div className="space-y-12">
      <section>
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-primary text-5xl font-extrabold tracking-tight mb-2">
              Daily <br />Breakdown.
            </h1>
            <p className="text-secondary font-body text-sm opacity-70">
              {format(new Date(), 'EEEE, MMMM do yyyy')}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-1">Total Burned</span>
            <CurrencyValue 
              amount={report?.totalAmount.EUR || 0} 
              amounts={report?.totalAmount}
              size="lg" 
              className="text-primary"
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Visualization Card */}
        <Card variant="lowest" className="h-96 flex items-center justify-center border border-outline-variant/10">
          {isLoading ? (
            <div className="animate-pulse w-48 h-48 rounded-full bg-surface-container-high"></div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} 
                  itemStyle={{ fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-secondary opacity-30 font-body text-sm">
              No data to visualize yet.
            </div>
          )}
        </Card>

        {/* Category breakdown list */}
        <div className="space-y-8">
          <h3 className="font-headline text-lg font-bold text-primary uppercase tracking-widest">
            Spending by Category
          </h3>
          <div className="space-y-6">
            {report?.categories.map((category) => (
              <div key={category.categoryId} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined" style={{ color: category.color }}>{category.icon}</span>
                    <span className="font-body font-bold text-sm text-primary">{category.name}</span>
                  </div>
                  <CurrencyValue 
                    amount={category.totalAmount.EUR} 
                    amounts={category.totalAmount}
                    className="font-body font-bold"
                  />
                </div>
                <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ 
                      width: `${category.percentage}%`, 
                      backgroundColor: category.color 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyReportPage;
