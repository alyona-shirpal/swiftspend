import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';
import { ensureUserCurrencies } from '../services/userCurrencies';
import { z } from 'zod';
import { Currency } from '../types';

const DailyReportSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.enum(['UAH', 'ALL', 'EUR', 'USD']).optional(),
});

const MonthlyReportSchema = z.object({
  year: z.string().regex(/^\d{4}$/),
  month: z.string().regex(/^(0?[1-9]|1[0-2])$/),
  currency: z.enum(['UAH', 'ALL', 'EUR', 'USD']).optional(),
});

const YearlyReportSchema = z.object({
  year: z.string().regex(/^\d{4}$/),
  currency: z.enum(['UAH', 'ALL', 'EUR', 'USD']).optional(),
});

async function getUserDefaultCurrency(userId: string): Promise<Currency> {
  const rows = await ensureUserCurrencies(userId);
  const match = rows.find((row) => row.is_default) ?? rows[0];
  return match?.currency ?? Currency.EUR;
}

async function assertCurrencyActive(userId: string, currency: Currency): Promise<void> {
  const rows = await ensureUserCurrencies(userId);
  if (!rows.some((row) => row.currency === currency)) {
    throw Object.assign(new Error('Currency not enabled for user'), { statusCode: 400 });
  }
}

function getAmountForCurrency(amounts: unknown, currency: Currency): number {
  if (!amounts || typeof amounts !== 'object') return 0;
  const value = (amounts as Record<string, unknown>)[currency];
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  return 0;
}

export const getDailyReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { date, currency } = DailyReportSchema.parse(req.query);
    const userId = req.user!.id;

    const effectiveCurrency = (currency as Currency | undefined) ?? (await getUserDefaultCurrency(userId));
    await assertCurrencyActive(userId, effectiveCurrency);

    const { data: expenses, error } = await supabaseAdmin
      .from('expenses')
      .select('id, category_id, description, date, created_at, amount, currency, amounts')
      .eq('user_id', userId)
      .eq('date', date)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const expenseRows = (expenses ?? []) as Array<{
      id: string;
      category_id: string | null;
      description: string | null;
      date: string;
      created_at: string;
      amount: number;
      currency: Currency;
      amounts: Record<string, unknown>;
    }>;

    const total = expenseRows.reduce((sum, e) => sum + getAmountForCurrency(e.amounts, effectiveCurrency), 0);

    const byCategory = new Map<string, { total: number; count: number }>();
    for (const e of expenseRows) {
      const key = e.category_id ?? '__null__';
      const prev = byCategory.get(key) ?? { total: 0, count: 0 };
      byCategory.set(key, {
        total: prev.total + getAmountForCurrency(e.amounts, effectiveCurrency),
        count: prev.count + 1,
      });
    }

    res.json({
      default_currency: effectiveCurrency,
      amounts: { [effectiveCurrency]: Number(total.toFixed(2)) },
      categories: Array.from(byCategory.entries()).map(([category_id, v]) => ({
        category_id: category_id === '__null__' ? null : category_id,
        default_currency: effectiveCurrency,
        amounts: { [effectiveCurrency]: Number(v.total.toFixed(2)) },
        count: v.count,
      })),
      expenses: expenseRows,
    });
  } catch (err) {
    next(err);
  }
};

export const getMonthlyReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { year, month, currency } = MonthlyReportSchema.parse(req.query);
    const userId = req.user!.id;

    const effectiveCurrency = (currency as Currency | undefined) ?? (await getUserDefaultCurrency(userId));
    await assertCurrencyActive(userId, effectiveCurrency);

    const targetDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: expenses, error } = await supabaseAdmin
      .from('expenses')
      .select('id, category_id, date, amounts')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const rows = (expenses ?? []) as Array<{ id: string; category_id: string | null; date: string; amounts: Record<string, unknown> }>;

    const total = rows.reduce((sum, e) => sum + getAmountForCurrency(e.amounts, effectiveCurrency), 0);

    const byCategory = new Map<string, { total: number; count: number }>();
    const byDay = new Map<string, number>();

    for (const e of rows) {
      const amt = getAmountForCurrency(e.amounts, effectiveCurrency);
      const catKey = e.category_id ?? '__null__';
      const prevCat = byCategory.get(catKey) ?? { total: 0, count: 0 };
      byCategory.set(catKey, { total: prevCat.total + amt, count: prevCat.count + 1 });

      byDay.set(e.date, (byDay.get(e.date) ?? 0) + amt);
    }

    res.json({
      default_currency: effectiveCurrency,
      amounts: { [effectiveCurrency]: Number(total.toFixed(2)) },
      categories: Array.from(byCategory.entries()).map(([category_id, v]) => ({
        category_id: category_id === '__null__' ? null : category_id,
        total: Number(v.total.toFixed(2)),
        count: v.count,
      })),
      daily_totals: Array.from(byDay.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, total: Number(v.toFixed(2)) })),
    });
  } catch (err) {
    next(err);
  }
};

export const getYearlyReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { year, currency } = YearlyReportSchema.parse(req.query);
    const userId = req.user!.id;

    const effectiveCurrency = (currency as Currency | undefined) ?? (await getUserDefaultCurrency(userId));
    await assertCurrencyActive(userId, effectiveCurrency);

    const targetDate = new Date(parseInt(year), 0, 1);
    const startDate = new Date(targetDate.getFullYear(), 0, 1).toISOString().split('T')[0];
    const endDate = new Date(targetDate.getFullYear(), 11, 31).toISOString().split('T')[0];

    const { data: expenses, error } = await supabaseAdmin
      .from('expenses')
      .select('id, category_id, date, amounts')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const rows = (expenses ?? []) as Array<{ id: string; category_id: string | null; date: string; amounts: Record<string, unknown> }>;

    const total = rows.reduce((sum, e) => sum + getAmountForCurrency(e.amounts, effectiveCurrency), 0);

    const byMonth = new Map<string, number>();
    const byCategory = new Map<string, number>();

    for (const e of rows) {
      const amt = getAmountForCurrency(e.amounts, effectiveCurrency);
      const month = e.date.slice(0, 7); // YYYY-MM
      byMonth.set(month, (byMonth.get(month) ?? 0) + amt);

      const catKey = e.category_id ?? '__null__';
      byCategory.set(catKey, (byCategory.get(catKey) ?? 0) + amt);
    }

    const topCategories = Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category_id, v]) => ({
        category_id: category_id === '__null__' ? null : category_id,
        total: Number(v.toFixed(2)),
      }));

    res.json({
      default_currency: effectiveCurrency,
      amounts: { [effectiveCurrency]: Number(total.toFixed(2)) },
      monthly_totals: Array.from(byMonth.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, v]) => ({ month, total: Number(v.toFixed(2)) })),
      top_categories: topCategories,
    });
  } catch (err) {
    next(err);
  }
};
