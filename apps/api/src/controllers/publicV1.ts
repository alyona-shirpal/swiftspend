import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/auth';
import { supabaseAdmin, createSupabaseUserClient } from '../services/supabase';
import { z } from 'zod';
import { createExpenseRecord } from '../services/createExpense';
import { createExpenseRecordAdmin } from '../services/createExpenseAdmin';
import { updateExpenseRecord } from '../services/updateExpenseRecord';

const PublicExpenseSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  category_id: z.string().uuid().nullable().optional(),
  category_name: z.string().trim().optional(),
  merchant: z.string().trim().max(120).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const PublicUpdateExpenseSchema = z.object({
  amount: z.number().positive().optional(),
  currency: z.string().min(3).max(3).optional(),
  category_id: z.string().uuid().nullable().optional(),
  category_name: z.string().trim().optional(),
  merchant: z.string().trim().max(120).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const publicCreateExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const validated = PublicExpenseSchema.parse(req.body);
    let resolvedCategoryId = validated.category_id ?? null;

    // If category_name was provided instead of category_id, try to resolve it
    if (!resolvedCategoryId && validated.category_name) {
      const { data: cat } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .ilike('name', validated.category_name.trim())
        .single();
      
      if (cat) {
        resolvedCategoryId = cat.id;
      }
    }

    const payload = {
      amount: validated.amount,
      currency: validated.currency.toUpperCase(),
      category_id: resolvedCategoryId,
      merchant: validated.merchant ?? null,
      description: validated.description ?? null,
      date: validated.date,
    };

    let data;
    if (req.accessToken) {
      data = await createExpenseRecord(req.accessToken, userId, payload);
    } else {
      data = await createExpenseRecordAdmin(userId, payload);
    }

    return res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const publicGetExpenses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit = '20', page = '1' } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100);
    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const fromIndex = (pageNum - 1) * limitNum;
    const toIndex = fromIndex + limitNum - 1;

    const client = req.accessToken ? createSupabaseUserClient(req.accessToken) : supabaseAdmin;

    const { data, count, error } = await client
      .from('expenses')
      .select('*, category:categories(id, name, icon, color)', { count: 'exact' })
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(fromIndex, toIndex);

    if (error) throw error;

    return res.json({
      data: data || [],
      metadata: {
        total: count || 0,
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const publicGetCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const client = req.accessToken ? createSupabaseUserClient(req.accessToken) : supabaseAdmin;

    const { data, error } = await client
      .from('categories')
      .select('id, name, icon, color, is_system, is_hidden, last_used_at')
      .eq('user_id', userId)
      .eq('is_hidden', false)
      .order('name', { ascending: true });

    if (error) throw error;

    return res.json({ categories: data || [] });
  } catch (err) {
    next(err);
  }
};

export const publicUpdateExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Expense ID is required' });
    }

    const validated = PublicUpdateExpenseSchema.parse(req.body);
    let resolvedCategoryId = validated.category_id;

    // If category_name was provided instead of category_id, try to resolve it
    if (resolvedCategoryId === undefined && validated.category_name) {
      const { data: cat } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .ilike('name', validated.category_name.trim())
        .maybeSingle();

      if (cat) {
        resolvedCategoryId = cat.id;
      }
    }

    const client = req.accessToken ? createSupabaseUserClient(req.accessToken) : supabaseAdmin;

    const payload = {
      ...(validated.amount !== undefined ? { amount: validated.amount } : {}),
      ...(validated.currency !== undefined ? { currency: validated.currency.toUpperCase() } : {}),
      ...(resolvedCategoryId !== undefined ? { category_id: resolvedCategoryId } : {}),
      ...(validated.merchant !== undefined ? { merchant: validated.merchant } : {}),
      ...(validated.description !== undefined ? { description: validated.description } : {}),
      ...(validated.date !== undefined ? { date: validated.date } : {}),
    };

    const data = await updateExpenseRecord(client, userId, id, payload);
    return res.json(data);
  } catch (err: any) {
    if (err.status === 404 || err.message === 'Expense not found') {
      return res.status(404).json({ error: 'Not found' });
    }
    next(err);
  }
};
