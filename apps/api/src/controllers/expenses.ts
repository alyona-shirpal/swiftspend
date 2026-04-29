import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';
import { ExchangeRateService } from '../services/exchangeRate';
import { ensureUserCurrencies } from '../services/userCurrencies';
import {
  RecentExpenseJoinRow
} from '../types/supabase';
import { z } from 'zod';
import { Currency } from '../types';

const ExpenseSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(['UAH', 'ALL', 'EUR', 'USD']),
  category_id: z.string().uuid().optional(),
  description: z.string().max(200).optional(),
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
    const userId = req.user!.id;

    const currencyRows = await ensureUserCurrencies(userId);
    const userCurrencies = currencyRows
      .map((r) => r.currency)
      .filter((c): c is Currency => Object.values(Currency).includes(c as Currency))
      .map((c) => c as Currency);

    const snapshot = await ExchangeRateService.getCachedRates();
    const amounts = await ExchangeRateService.convertToUserCurrencies(
      validated.amount,
      validated.currency as Currency,
      userCurrencies,
      snapshot
    );

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert({
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        // created_at is automatically set by the DB
        category_id: validated.category_id ?? null,
        description: validated.description ?? null,
        amount: validated.amount,
        currency: validated.currency,
        amounts,
        exchange_rate_snapshot: snapshot
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

    let updatePayload: Record<string, unknown> = {
      ...(validated.category_id !== undefined ? { category_id: validated.category_id } : {}),
      ...(validated.description !== undefined ? { description: validated.description } : {}),
      ...(validated.amount !== undefined ? { amount: validated.amount } : {}),
      ...(validated.currency !== undefined ? { currency: validated.currency } : {}),
    };

    // Re-convert if amount or currency changed
    if (validated.amount !== undefined || validated.currency !== undefined) {
      const userId = req.user!.id;
      const currencyRows = await ensureUserCurrencies(userId);
      const userCurrencies = currencyRows
        .map((r) => r.currency)
        .filter((c): c is Currency => Object.values(Currency).includes(c as Currency))
        .map((c) => c as Currency);

      const finalAmount = validated.amount ?? existing.amount;
      const finalCurrency = (validated.currency ?? existing.currency) as Currency;

      const snapshot = await ExchangeRateService.getCachedRates();
      const amounts = await ExchangeRateService.convertToUserCurrencies(
        finalAmount,
        finalCurrency,
        userCurrencies,
        snapshot
      );

      updatePayload = {
        ...updatePayload,
        amounts,
        exchange_rate_snapshot: snapshot,
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
        amounts,
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
    const rows = (data ?? []) as unknown as (RecentExpenseJoinRow & { amounts: Record<string, number> | null })[];

    const formattedData = rows.map((item) => ({
      id: item.id,
      description: item.description,
      date: item.date,
      time: item.created_at, // Map created_at to time
      amount: item.amount,
      currency: item.currency,
      amounts: item.amounts ?? {},
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

// NOTE: monthly totals have moved to /reports endpoints (jsonb-backed).
