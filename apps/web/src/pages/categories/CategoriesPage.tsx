import React from 'react';
import { useCategories } from '../../hooks/useCategories';
import { Card } from '../../components/ui/Card';
import { CurrencyValue } from '../../components/currency/CurrencyValue';
import { Button } from '../../components/ui/Button';

const CategoriesPage: React.FC = () => {
  const { data: categories, isLoading } = useCategories();

  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-primary text-5xl font-extrabold tracking-tight mb-4">
          All <br />Categories.
        </h1>
        <p className="text-secondary font-body text-sm max-w-sm opacity-70">
          Track your spending breakdown across your custom financial compartments.
        </p>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="aspect-square bg-surface-container-low animate-pulse rounded-2xl"></div>
          ))
        ) : categories?.map((category) => (
          <Card 
            key={category.id} 
            variant="lowest" 
            className="aspect-square flex flex-col justify-between group active:scale-95 transition-all cursor-pointer border border-outline-variant/10 hover:border-outline-variant/30"
          >
            <div className="flex justify-between items-start">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                <span className="material-symbols-outlined">{category.icon}</span>
              </div>
              <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-surface-container-high rounded-full">
                <span className="material-symbols-outlined text-sm text-secondary">more_vert</span>
              </button>
            </div>

            <div>
              <h3 className="font-headline font-bold text-lg text-primary mb-1">
                {category.name}
              </h3>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest font-bold text-secondary opacity-60 mb-1">
                  Monthly Total
                </span>
                <CurrencyValue 
                  amount={category.totalSpentMonth?.EUR || 0} 
                  amounts={category.totalSpentMonth}
                  className="text-primary font-bold"
                />
              </div>
            </div>
          </Card>
        ))}

        {/* Add Category Trigger */}
        <button className="aspect-square flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-outline-variant hover:border-primary transition-colors group">
          <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
            <span className="material-symbols-outlined">add</span>
          </div>
          <span className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">New Category</span>
        </button>
      </div>
    </div>
  );
};

export default CategoriesPage;
