import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Currency } from '@swiftspend/types';
import { useCategories } from '../../hooks/useCategories';
import { useCreateExpense } from '../../hooks/useExpenses';
import { useExchangeRates } from '../../hooks/useExchangeRates';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { cn } from '../../utils/cn';

const expenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.nativeEnum(Currency),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  date: z.string(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const AddExpensePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const { mutate: createExpense, isPending } = useCreateExpense();
  const { data: rates } = useExchangeRates();

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(Currency.EUR);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('0.00');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      currency: Currency.EUR,
      date: new Date().toISOString().split('T')[0],
      amount: 0,
    }
  });

  const onSubmit = (data: ExpenseFormValues) => {
    createExpense(
      { ...data, amount: parseFloat(amount) },
      { onSuccess: () => navigate('/') }
    );
  };

  const handleNumberInput = (num: string) => {
    if (num === '.' && amount.includes('.')) return;
    if (amount === '0.00') {
      setAmount(num === '.' ? '0.' : num);
    } else {
      setAmount(amount + num);
    }
  };

  const handleBackspace = () => {
    if (amount.length <= 1) {
      setAmount('0.00');
    } else {
      setAmount(amount.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden max-w-xl mx-auto w-full">
      {/* Top Header - Mobile specific for this page */}
      <section className="flex justify-between items-center mb-8">
        <div className="flex bg-surface-container-low rounded-lg p-1">
          {[Currency.USD, Currency.EUR, Currency.ALL, Currency.UAH].map((curr) => (
            <button
              key={curr}
              type="button"
              onClick={() => {
                setSelectedCurrency(curr);
                setValue('currency', curr);
              }}
              className={cn(
                "px-4 py-1.5 text-[10px] font-bold font-headline rounded-md transition-all duration-200",
                selectedCurrency === curr ? "bg-white text-primary shadow-sm" : "text-secondary opacity-60"
              )}
            >
              {curr}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-lg">
          <span className="material-symbols-outlined text-sm">calendar_today</span>
          <span className="text-[10px] font-bold font-headline uppercase tracking-wider">Today</span>
        </div>
      </section>

      {/* Amount Display */}
      <section className="mb-12">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary mb-2 text-center">Amount to Log</p>
        <div className="flex items-baseline justify-center gap-2">
          <span className="font-headline text-2xl font-light text-secondary">
            {selectedCurrency === Currency.EUR ? '€' : selectedCurrency === Currency.ALL ? 'L' : selectedCurrency === Currency.USD ? '$' : '₴'}
          </span>
          <div className="font-headline text-[5rem] font-bold tracking-tighter leading-none text-primary">
            {amount}
          </div>
        </div>
      </section>

      {/* Category Selection */}
      <section className="mb-8 overflow-y-auto max-h-64 no-scrollbar">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Quick Category</h2>
          <span className="text-[10px] font-medium text-secondary underline cursor-pointer">View All</span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {categories?.slice(0, 8).map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setSelectedCategory(category.id);
                setValue('categoryId', category.id);
              }}
              className={cn(
                "aspect-square flex flex-col items-center justify-center gap-2 bg-white rounded-xl shadow-sm border-2 transition-all active:scale-95",
                selectedCategory === category.id ? "border-primary" : "border-transparent"
              )}
            >
              <span className="material-symbols-outlined text-secondary" style={{ color: category.color }}>
                {category.icon}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-tighter text-center px-1 truncate w-full">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Numeric Keypad */}
      <section className="mt-auto grid grid-cols-3 gap-1 bg-surface-container-low p-2 rounded-2xl mb-8">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => handleNumberInput(val)}
            className="py-6 text-2xl font-headline font-bold hover:bg-white rounded-xl transition-colors active:bg-white/80"
          >
            {val}
          </button>
        ))}
        <button
          type="button"
          onClick={handleBackspace}
          className="py-6 flex items-center justify-center hover:bg-white rounded-xl transition-colors active:bg-white/80"
        >
          <span className="material-symbols-outlined text-2xl">backspace</span>
        </button>
      </section>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 w-full bg-white px-6 py-4 pb-safe flex items-center gap-4 border-t border-surface-container-high z-50">
        <div className="flex-1">
          <input 
            {...register('description')}
            className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm focus:ring-0 placeholder:text-slate-400" 
            placeholder="Add note..." 
            type="text" 
          />
        </div>
        <Button 
          onClick={handleSubmit(onSubmit)}
          isLoading={isPending}
          className="h-12 w-12 rounded-full p-0 shadow-lg"
        >
          <span className="material-symbols-outlined font-bold">check</span>
        </Button>
      </div>
    </div>
  );
};

export default AddExpensePage;
