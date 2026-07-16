import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createSupabaseUserClient } from '../services/supabase';
import { ExchangeRateService } from '../services/exchangeRate';
import { ensureUserCurrencies } from '../services/userCurrencies';
import {
  RecentExpenseJoinRow
} from '../types/supabase';
import { z } from 'zod';
import { Currency } from '../types';
import { createExpenseRecord } from '../services/createExpense';
import type { RateSnapshot } from '@swiftspend/types';

const ExpenseSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  category_id: z.string().uuid().nullable().optional(),
  merchant: z.string().trim().max(120).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD from the client date picker
});

const TextSuggestionsSchema = z.object({
  category_id: z.string().uuid(),
  q: z.string().max(2000).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
});

const normalizeNote = (value: string | null | undefined) => {
  const normalized = value?.trim().toLowerCase() ?? '';
  return normalized || null;
};

const markCategoryLastUsed = async (
  supabase: ReturnType<typeof createSupabaseUserClient>,
  userId: string,
  categoryId: string | null | undefined,
  lastUsedAt = new Date().toISOString()
) => {
  if (!categoryId) return;

  const { error } = await supabase
    .from('categories')
    .update({ last_used_at: lastUsedAt })
    .eq('id', categoryId)
    .eq('user_id', userId);

  if (error) throw error;
};

/**
 * Retrieves a list of expenses for the authenticated user.
 * Supports filtering by date range (from/to), category, currency, and full-text search.
 * Results are paginated.
 * 
 * @param req AuthRequest containing user credentials and query parameters
 * @param res Response object to send JSON response
 * @param next NextFunction to handle errors
 */
export const getExpenses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { from, to, category_id, currency, search, page = '1', limit = '50' } = req.query;
    const supabase = createSupabaseUserClient(req.accessToken!);

    let query = supabase
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);
    if (category_id) query = query.eq('category_id', category_id);
    if (currency) query = query.eq('currency', currency);
    const normalizedSearch = normalizeNote(typeof search === 'string' ? search : undefined);
    if (normalizedSearch) {
      query = query.or(
        `normalized_description.ilike.%${normalizedSearch}%,normalized_merchant.ilike.%${normalizedSearch}%`,
      );
    }

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

export const getNoteSuggestions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category_id, q, limit } = TextSuggestionsSchema.parse(req.query);
    const normalizedQuery = normalizeNote(q);
    const resultLimit = Math.min(parseInt(limit ?? '6', 10), 12);
    const supabase = createSupabaseUserClient(req.accessToken!);

    let query = supabase
      .from('expenses')
      .select('description, normalized_description, created_at')
      .eq('user_id', req.user!.id)
      .eq('category_id', category_id)
      .not('normalized_description', 'is', null)
      .order('created_at', { ascending: false })
      .limit(200);

    if (normalizedQuery) {
      query = query.ilike('normalized_description', `%${normalizedQuery}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const suggestions = new Map<
      string,
      { note: string; normalized_note: string; count: number; last_used_at: string }
    >();

    for (const row of data ?? []) {
      const normalizedNote = normalizeNote(row.normalized_description);
      const displayNote = row.description?.trim();
      if (!normalizedNote || !displayNote) continue;

      const existing = suggestions.get(normalizedNote);
      if (existing) {
        existing.count += 1;
        continue;
      }

      suggestions.set(normalizedNote, {
        note: displayNote,
        normalized_note: normalizedNote,
        count: 1,
        last_used_at: row.created_at,
      });
    }

    res.json(Array.from(suggestions.values()).slice(0, resultLimit));
  } catch (err) {
    next(err);
  }
};

export const getMerchantSuggestions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category_id, q, limit } = TextSuggestionsSchema.parse(req.query);
    const normalizedQuery = normalizeNote(q);
    const resultLimit = Math.min(parseInt(limit ?? '6', 10), 12);
    const supabase = createSupabaseUserClient(req.accessToken!);

    let query = supabase
      .from('expenses')
      .select('merchant, normalized_merchant, created_at')
      .eq('user_id', req.user!.id)
      .eq('category_id', category_id)
      .not('normalized_merchant', 'is', null)
      .order('created_at', { ascending: false })
      .limit(200);

    if (normalizedQuery) {
      query = query.ilike('normalized_merchant', `%${normalizedQuery}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const suggestions = new Map<
      string,
      { merchant: string; normalized_merchant: string; count: number; last_used_at: string }
    >();

    for (const row of data ?? []) {
      const normalizedMerchant = normalizeNote(row.normalized_merchant);
      const displayMerchant = row.merchant?.trim();
      if (!normalizedMerchant || !displayMerchant) continue;

      const existing = suggestions.get(normalizedMerchant);
      if (existing) {
        existing.count += 1;
        continue;
      }

      suggestions.set(normalizedMerchant, {
        merchant: displayMerchant,
        normalized_merchant: normalizedMerchant,
        count: 1,
        last_used_at: row.created_at,
      });
    }

    res.json(Array.from(suggestions.values()).slice(0, resultLimit));
  } catch (err) {
    next(err);
  }
};

export const getExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const supabase = createSupabaseUserClient(req.accessToken!);
    const { data, error } = await supabase
      .from('expenses')
      .select('*, category:categories(id, name, icon, color)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Not found' });
      throw error;
    }

    const snapshot = data.exchange_rate_snapshot as unknown as RateSnapshot;
    const currencies = await ensureUserCurrencies(userId, supabase);
    const selectedCurrencies = new Set<string>(
      currencies.map(({ currency }) => currency),
    );
    const selectedRates = Object.fromEntries(
      Object.entries(snapshot.rates).filter(([currency]) =>
        selectedCurrencies.has(currency),
      ),
    );

    res.json({
      ...data,
      exchange_rate_snapshot: {
        ...snapshot,
        rates: selectedRates,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = ExpenseSchema.parse(req.body);
    const data = await createExpenseRecord(req.accessToken!, req.user!.id, validated);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
};

export const updateExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validated = ExpenseSchema.partial().parse(req.body);
    const { id } = req.params;
    const supabase = createSupabaseUserClient(req.accessToken!);

    const { data: existing } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!existing) return res.status(404).json({ error: 'Not found' });

    let updatePayload: Record<string, unknown> = {
      ...(validated.category_id !== undefined ? { category_id: validated.category_id } : {}),
      ...(validated.merchant !== undefined ? { merchant: validated.merchant } : {}),
      ...(validated.description !== undefined ? { description: validated.description } : {}),
      ...(validated.date !== undefined ? { date: validated.date } : {}),
      ...(validated.amount !== undefined ? { amount: validated.amount } : {}),
      ...(validated.currency !== undefined ? { currency: validated.currency } : {}),
    };

    // Re-convert if amount or currency changed
    if (validated.amount !== undefined || validated.currency !== undefined) {
      const userId = req.user!.id;
      const currencies = await ensureUserCurrencies(userId, supabase);
      const userCurrencies = currencies.map((r) => r.currency as Currency);

      const finalAmount = validated.amount ?? existing.amount;
      const finalCurrency = (validated.currency ?? existing.currency) as Currency;

      const snapshot = await ExchangeRateService.getCachedRates(supabase);
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

    const { data, error } = await supabase
      .from('expenses')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (
      validated.category_id !== undefined &&
      validated.category_id !== existing.category_id
    ) {
      await markCategoryLastUsed(supabase, req.user!.id, validated.category_id);
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const supabase = createSupabaseUserClient(req.accessToken!);

    const { data: existing } = await supabase
      .from('expenses')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!existing) return res.status(404).json({ error: 'Not found' });

    const { error } = await supabase
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
    const supabase = createSupabaseUserClient(req.accessToken!);
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        id,
        merchant,
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
      merchant: item.merchant,
      description: item.description,
      date: item.date,
      time: item.created_at,
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

export const getMonthlyTotal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const supabase = createSupabaseUserClient(req.accessToken!);
    const currencies = await ensureUserCurrencies(userId, supabase);
    const userCurrencyCodes = currencies.map((c) => c.currency);
    const defaultCurrency = currencies.find((c) => c.is_default)?.currency || 'EUR';

    let currency = req.query.currency as string | undefined;
    if (!currency) {
      currency = defaultCurrency;
    }

    const targetYearQuery = req.query.year ? parseInt(req.query.year as string) : null;
    const targetMonthQuery = req.query.month ? parseInt(req.query.month as string) : null;
    
    let year: number;
    let month: number;

    if (targetYearQuery && targetMonthQuery) {
      year = targetYearQuery;
      month = targetMonthQuery - 1; // Convert to 0-indexed
    } else {
      const targetDateStr = (req.query.date as string) || new Date().toISOString();
      const targetDate = new Date(targetDateStr);
      year = targetDate.getUTCFullYear();
      month = targetDate.getUTCMonth();
    }

    const getMonthRange = (y: number, m: number) => {
      const start = new Date(Date.UTC(y, m, 1));
      const end = new Date(Date.UTC(y, m + 1, 0));
      return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
    };

    const currentRange = getMonthRange(year, month);
    const prevRange = getMonthRange(year, month - 1);

    const [{ data: currentData }, { data: prevData }] = await Promise.all([
      supabase
        .from('expenses')
        .select('amounts')
        .eq('user_id', userId)
        .gte('date', currentRange.start)
        .lte('date', currentRange.end),
      supabase
        .from('expenses')
        .select('amounts')
        .eq('user_id', userId)
        .gte('date', prevRange.start)
        .lte('date', prevRange.end)
    ]);

    const sumByCurrency = (rows: { amounts: unknown }[] | null, code: string) =>
      (rows || []).reduce((sum, row) => {
        const amounts = row.amounts as Record<string, number> | null;
        return sum + (amounts?.[code] || 0);
      }, 0);

    const totals: Record<string, number> = {};
    const previousTotals: Record<string, number> = {};
    for (const code of userCurrencyCodes) {
      totals[code] = sumByCurrency(currentData, code);
      previousTotals[code] = sumByCurrency(prevData, code);
    }

    const currentTotal = totals[currency] ?? 0;
    const previousTotal = previousTotals[currency] ?? 0;

    let change_percent = 0;
    if (previousTotal > 0) {
      change_percent = ((currentTotal - previousTotal) / previousTotal) * 100;
    } else if (currentTotal > 0) {
      change_percent = 100;
    }

    const direction = currentTotal > previousTotal ? 'up' : currentTotal < previousTotal ? 'down' : 'same';

    res.json({
      year,
      month: month + 1,
      default_currency: defaultCurrency,
      totals,
      previous_totals: previousTotals,
      comparison: { 
        previous_month_eur: previousTotals['EUR'] ?? 0, 
        change_percent: Math.round(change_percent * 100) / 100, 
        direction 
      }
    });
  } catch (err) {
    next(err);
  }
};
