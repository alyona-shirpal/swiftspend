import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';
import { ExchangeRateService } from '../services/exchangeRate';
import { Currency } from '../types';
import { z } from 'zod';

const ExpenseSchema = z.object({
  amount: z.number().positive(),
  currency: z.nativeEnum(Currency),
  category_id: z.string().uuid().optional().nullable(),
  description: z.string().max(200).optional().nullable()
});

export const getExpenses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to, category_id, currency, search, page = '1', limit = '50' } = req.query;

    let query = supabaseAdmin
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);
    if (category_id) query = query.eq('category_id', category_id);
    if (currency) query = query.eq('currency', currency);
    if (search) query = query.ilike('description', `%${search}%`);

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const fromIndex = (pageNum - 1) * limitNum;
    const toIndex = fromIndex + limitNum - 1;

    query = query.range(fromIndex, toIndex);

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({
      data,
      metadata: { total: count, page: pageNum, limit: limitNum }
    });
  } catch (err) {
    next(err);
  }
};

export const getExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Not found' });
      throw error;
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const createExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = ExpenseSchema.parse(req.body);

    const { rates } = await ExchangeRateService.getCachedRates();
    const convertedData = ExchangeRateService.convertToAll(validated.amount, validated.currency, rates);

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert({
        user_id: req.user!.id,
        date: new Date().toISOString().split('T')[0],
        // created_at is automatically set by the DB
        ...validated,
        ...convertedData
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const updateExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = ExpenseSchema.partial().parse(req.body);
    const { id } = req.params;

    const { data: existing } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!existing) return res.status(404).json({ error: 'Not found' });

    let updatePayload: Record<string, unknown> = { ...validated };

    // Re-convert if amount or currency changed
    if (
      (validated.amount !== undefined && validated.amount !== existing.amount) ||
      (validated.currency !== undefined && validated.currency !== existing.currency)
    ) {
      const finalAmount = validated.amount ?? existing.amount;
      const finalCurrency = validated.currency ?? existing.currency;

      const { rates } = await ExchangeRateService.getCachedRates();
      const convertedData = ExchangeRateService.convertToAll(finalAmount, finalCurrency, rates);

      updatePayload = {
        ...updatePayload,
        ...convertedData
      };
    }

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data: existing } = await supabaseAdmin
      .from('expenses')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!existing) return res.status(404).json({ error: 'Not found' });

    const { error } = await supabaseAdmin
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const getRecentExpenses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Top 10 most recent expenses with category data
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .select(`
        id,
        description,
        date,
        created_at,
        amount,
        currency,
        amount_eur,
        categories (
          id,
          name,
          icon,
          color
        )
      `)
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    // Map to the requested response shape
    const formattedData = data.map((item: any) => ({
      id: item.id,
      description: item.description,
      date: item.date,
      time: item.created_at, // Map created_at to time
      amount: item.amount,
      currency: item.currency,
      amount_eur: item.amount_eur,
      category: item.categories ? {
        id: item.categories.id,
        name: item.categories.name,
        icon: item.categories.icon,
        color: item.categories.color
      } : null
    }));

    res.json(formattedData);
  } catch (err) {
    next(err);
  }
};

export const getMonthlyTotal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { year, month } = req.query;
    
    const now = new Date();
    const targetYear = year ? parseInt(year as string) : now.getFullYear();
    const targetMonth = month ? parseInt(month as string) : now.getMonth() + 1; // 1-12
    
    // Calculate start and end dates for the target month
    const startDate = new Date(targetYear, targetMonth - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0];

    // Calculate start and end dates for the previous month
    const prevMonthDate = new Date(targetYear, targetMonth - 2, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth() + 1;
    const prevStartDate = new Date(prevYear, prevMonth - 1, 1).toISOString().split('T')[0];
    const prevEndDate = new Date(prevYear, prevMonth, 0).toISOString().split('T')[0];

    // Get current month expenses
    const { data: currentMonthData, error: currentError } = await supabaseAdmin
      .from('expenses')
      .select('amount_uah, amount_all, amount_eur, amount_usd')
      .eq('user_id', req.user!.id)
      .gte('date', startDate)
      .lte('date', endDate);

    if (currentError) throw currentError;

    // Get previous month expenses for comparison
    const { data: prevMonthData, error: prevError } = await supabaseAdmin
      .from('expenses')
      .select('amount_eur')
      .eq('user_id', req.user!.id)
      .gte('date', prevStartDate)
      .lte('date', prevEndDate);

    if (prevError) throw prevError;

    const totals = currentMonthData.reduce((acc: any, curr: any) => {
      acc.UAH += curr.amount_uah;
      acc.ALL += curr.amount_all;
      acc.EUR += curr.amount_eur;
      acc.USD += curr.amount_usd;
      return acc;
    }, { UAH: 0, ALL: 0, EUR: 0, USD: 0 });

    const prevMonthEurTotal = prevMonthData.reduce((sum: number, curr: any) => sum + curr.amount_eur, 0);

    let changePercent = 0;
    let direction: 'up' | 'down' | 'same' = 'same';

    if (prevMonthEurTotal > 0) {
      changePercent = ((totals.EUR - prevMonthEurTotal) / prevMonthEurTotal) * 100;
      if (changePercent > 0) direction = 'up';
      else if (changePercent < 0) direction = 'down';
    } else if (totals.EUR > 0) {
      // If previous month was 0 but this month is > 0, it's a 100% increase essentially
      changePercent = 100;
      direction = 'up';
    }

    res.json({
      year: targetYear,
      month: targetMonth,
      default_currency: 'EUR',
      totals,
      comparison: {
        previous_month_eur: prevMonthEurTotal,
        change_percent: Number(Math.abs(changePercent).toFixed(1)), // Make it positive and 1 decimal place
        direction
      }
    });
  } catch (err) {
    next(err);
  }
};
