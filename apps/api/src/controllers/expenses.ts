import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';
import { ExchangeRateService } from '../services/exchangeRate';
import { Currency } from '../types';
import { z } from 'zod';

const ExpenseSchema = z.object({
  category_id: z.string().uuid(),
  description: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  amount: z.number().positive(),
  currency: z.nativeEnum(Currency)
});

export const getExpenses = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const { from, to, category_id, currency, search, page = '1', limit = '50' } = req.query;

    let query = supabaseAdmin
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user!.id)
      .order('date', { ascending: false });

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

export const getExpense = async (req: AuthRequest, res: Response, next: any) => {
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

export const createExpense = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const validated = ExpenseSchema.parse(req.body);

    const { rates } = await ExchangeRateService.getCachedRates();
    const convertedAmounts = ExchangeRateService.convertAmount(validated.amount, validated.currency, rates);

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert({
        user_id: req.user!.id,
        ...validated,
        ...convertedAmounts,
        exchange_rate_snapshot: rates
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const updateExpense = async (req: AuthRequest, res: Response, next: any) => {
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

    let updatePayload: any = { ...validated };

    // Re-convert if amount or currency changed
    if (
      (validated.amount !== undefined && validated.amount !== existing.amount) ||
      (validated.currency !== undefined && validated.currency !== existing.currency)
    ) {
      const finalAmount = validated.amount ?? existing.amount;
      const finalCurrency = validated.currency ?? existing.currency;

      const { rates } = await ExchangeRateService.getCachedRates();
      const convertedAmounts = ExchangeRateService.convertAmount(finalAmount, finalCurrency, rates);

      updatePayload = {
        ...updatePayload,
        ...convertedAmounts,
        exchange_rate_snapshot: rates
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

export const deleteExpense = async (req: AuthRequest, res: Response, next: any) => {
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
