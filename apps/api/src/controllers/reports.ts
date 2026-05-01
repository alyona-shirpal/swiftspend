import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';
import { z } from 'zod';

const DailyReportSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.string().min(3).max(3).optional(),
});

const MonthlyReportSchema = z.object({
  year: z.string().regex(/^\d{4}$/),
  month: z.string().regex(/^(0?[1-9]|1[0-2])$/),
  currency: z.string().min(3).max(3).optional(),
});

const YearlyReportSchema = z.object({
  year: z.string().regex(/^\d{4}$/),
  currency: z.string().min(3).max(3).optional(),
});

async function resolveCurrency(reqCurrency: string | undefined, userId: string): Promise<string> {
  if (reqCurrency) return reqCurrency;
  const { data } = await supabaseAdmin
    .from('user_currencies')
    .select('currency')
    .eq('user_id', userId)
    .eq('is_default', true)
    .limit(1)
    .single();
  return data?.currency || 'EUR';
}

function getAmount(amounts: any, currency: string): number {
  if (!amounts || typeof amounts !== 'object') return 0;
  return Number(amounts[currency]) || 0;
}

export const getDailyReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { date, currency: reqCurrency } = DailyReportSchema.parse(req.query);
    const userId = req.user!.id;
    const currency = await resolveCurrency(reqCurrency, userId);

    const { data: expenses, error } = await supabaseAdmin
      .from('expenses')
      .select(`
        id, category_id, description, date, created_at, amount, currency, amounts,
        categories (id, name, icon, color)
      `)
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: false });

    if (error) throw error;

    let totalAll = 0;
    const catMap = new Map<string, any>();

    for (const e of expenses || []) {
      const amt = getAmount(e.amounts, currency);
      totalAll += amt;

      const c = Array.isArray(e.categories) ? e.categories[0] : e.categories;
      const catId = c?.id ?? 'un-categorized';
      
      if (!catMap.has(catId)) {
        catMap.set(catId, {
          id: c?.id ?? null,
          name: c?.name ?? 'Uncategorized',
          icon: c?.icon ?? 'help',
          color: c?.color ?? '#999999',
          total: 0,
          count: 0
        });
      }
      const entry = catMap.get(catId);
      entry.total += amt;
      entry.count += 1;
    }

    const categories = Array.from(catMap.values()).sort((a, b) => b.total - a.total);

    res.json({
      default_currency: currency,
      totals: { [currency]: totalAll },
      categories,
      expenses
    });
  } catch (err) {
    next(err);
  }
};

export const getMonthlyReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { year, month, currency: reqCurrency } = MonthlyReportSchema.parse(req.query);
    const userId = req.user!.id;
    const currency = await resolveCurrency(reqCurrency, userId);

    const y = parseInt(year);
    const m = parseInt(month) - 1;
    const startDate = new Date(Date.UTC(y, m, 1)).toISOString().split('T')[0];
    const endDate = new Date(Date.UTC(y, m + 1, 0)).toISOString().split('T')[0];

    const { data: expenses, error } = await supabaseAdmin
      .from('expenses')
      .select('id, category_id, date, amounts, categories (id, name, icon, color)')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    let totalAll = 0;
    const catMap = new Map<string, any>();
    const dayMap = new Map<string, number>();

    for (const e of expenses || []) {
      const amt = getAmount(e.amounts, currency);
      totalAll += amt;

      const c = Array.isArray(e.categories) ? e.categories[0] : e.categories;
      const catId = c?.id ?? 'un-categorized';
      
      if (!catMap.has(catId)) {
        catMap.set(catId, {
          id: c?.id ?? null,
          name: c?.name ?? 'Uncategorized',
          icon: c?.icon ?? 'help',
          color: c?.color ?? '#999999',
          total: 0,
          count: 0
        });
      }
      const entry = catMap.get(catId);
      entry.total += amt;
      entry.count += 1;

      dayMap.set(e.date, (dayMap.get(e.date) || 0) + amt);
    }

    const categories = Array.from(catMap.values()).sort((a, b) => b.total - a.total);
    const daily_totals = Array.from(dayMap.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      default_currency: currency,
      totals: { [currency]: totalAll },
      categories,
      daily_totals
    });
  } catch (err) {
    next(err);
  }
};

export const getYearlyReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { year, currency: reqCurrency } = YearlyReportSchema.parse(req.query);
    const userId = req.user!.id;
    const currency = await resolveCurrency(reqCurrency, userId);

    const y = parseInt(year);
    const startDate = new Date(Date.UTC(y, 0, 1)).toISOString().split('T')[0];
    const endDate = new Date(Date.UTC(y, 11, 31)).toISOString().split('T')[0];

    const { data: expenses, error } = await supabaseAdmin
      .from('expenses')
      .select('id, category_id, date, amounts, categories (id, name, icon, color)')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    let totalAll = 0;
    const catMap = new Map<string, any>();
    const monthMap = new Map<string, number>();

    for (const e of expenses || []) {
      const amt = getAmount(e.amounts, currency);
      totalAll += amt;

      const c = Array.isArray(e.categories) ? e.categories[0] : e.categories;
      const catId = c?.id ?? 'un-categorized';
      
      if (!catMap.has(catId)) {
        catMap.set(catId, {
          id: c?.id ?? null,
          name: c?.name ?? 'Uncategorized',
          icon: c?.icon ?? 'help',
          color: c?.color ?? '#999999',
          total: 0
        });
      }
      catMap.get(catId).total += amt;

      const month = e.date.substring(0, 7); // YYYY-MM
      monthMap.set(month, (monthMap.get(month) || 0) + amt);
    }

    const top_categories = Array.from(catMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const monthly_totals = Array.from(monthMap.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      default_currency: currency,
      totals: { [currency]: totalAll },
      monthly_totals,
      top_categories
    });
  } catch (err) {
    next(err);
  }
};
