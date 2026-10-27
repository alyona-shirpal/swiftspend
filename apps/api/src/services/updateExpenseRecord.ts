import { Currency } from '../types';
import { supabaseAdmin, createSupabaseUserClient } from './supabase';
import { ExchangeRateService } from './exchangeRate';
import { ensureUserCurrencies } from './userCurrencies';
import { triggerSheetSync } from './triggerSheetSync';

export interface UpdateExpenseRecordInput {
  amount?: number;
  currency?: string;
  category_id?: string | null;
  merchant?: string | null;
  description?: string | null;
  date?: string;
}

export const updateExpenseRecord = async (
  client: ReturnType<typeof createSupabaseUserClient> | typeof supabaseAdmin,
  userId: string,
  expenseId: string,
  input: UpdateExpenseRecordInput,
) => {
  const { data: existing, error: fetchError } = await client
    .from('expenses')
    .select('*')
    .eq('id', expenseId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    const error = new Error('Expense not found');
    (error as any).status = 404;
    throw error;
  }

  let updatePayload: Record<string, unknown> = {
    ...(input.category_id !== undefined ? { category_id: input.category_id } : {}),
    ...(input.merchant !== undefined ? { merchant: input.merchant } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.date !== undefined ? { date: input.date } : {}),
    ...(input.amount !== undefined ? { amount: input.amount } : {}),
    ...(input.currency !== undefined ? { currency: input.currency } : {}),
  };

  // Re-convert if amount or currency changed
  if (input.amount !== undefined || input.currency !== undefined) {
    const currencies = await ensureUserCurrencies(userId, client as any);
    const userCurrencies = currencies.map((r) => r.currency as Currency);

    const finalAmount = input.amount ?? existing.amount;
    const finalCurrency = (input.currency ?? existing.currency) as Currency;

    const snapshot = await ExchangeRateService.getCachedRates(client as any);
    const amounts = await ExchangeRateService.convertToUserCurrencies(
      finalAmount,
      finalCurrency,
      userCurrencies,
      snapshot,
    );

    updatePayload = {
      ...updatePayload,
      amounts,
      exchange_rate_snapshot: snapshot,
    };
  }

  const { data, error } = await client
    .from('expenses')
    .update(updatePayload)
    .eq('id', expenseId)
    .eq('user_id', userId)
    .select('*, category:categories(id, name, icon, color)')
    .single();

  if (error) throw error;

  if (input.category_id && input.category_id !== existing.category_id) {
    await client
      .from('categories')
      .update({ last_used_at: data.created_at || new Date().toISOString() })
      .eq('id', input.category_id)
      .eq('user_id', userId);
  }

  // Google Sheets sync trigger (fire-and-forget)
  const newMonth: string = (data as { date: string }).date.slice(0, 7);
  const oldMonth: string | undefined = existing.date ? (existing.date as string).slice(0, 7) : undefined;
  triggerSheetSync(userId, newMonth);
  if (oldMonth && oldMonth !== newMonth) {
    triggerSheetSync(userId, oldMonth);
  }

  return data;
};
