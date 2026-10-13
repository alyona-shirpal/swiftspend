import { Currency } from '../types';
import { supabaseAdmin } from './supabase';
import { ExchangeRateService } from './exchangeRate';
import { ensureUserCurrencies } from './userCurrencies';
import { triggerSheetSync } from './triggerSheetSync';

export interface CreateExpenseAdminInput {
  amount: number;
  currency: string;
  category_id?: string | null;
  merchant?: string | null;
  description?: string | null;
  date?: string;
  provider?: string | null;
  external_id?: string | null;
}

export const createExpenseRecordAdmin = async (
  userId: string,
  input: CreateExpenseAdminInput,
) => {
  const currencies = await ensureUserCurrencies(userId, supabaseAdmin);
  const userCurrencies = currencies.map((row) => row.currency as Currency);
  const snapshot = await ExchangeRateService.getCachedRates(supabaseAdmin);
  const amounts = await ExchangeRateService.convertToUserCurrencies(
    input.amount,
    input.currency as Currency,
    userCurrencies,
    snapshot,
  );

  const { data, error } = await supabaseAdmin
    .from('expenses')
    .insert({
      user_id: userId,
      category_id: input.category_id ?? null,
      merchant: input.merchant ?? null,
      description: input.description ?? null,
      date: input.date ?? new Date().toISOString().split('T')[0],
      amount: input.amount,
      currency: input.currency,
      amounts,
      exchange_rate_snapshot: snapshot,
      provider: input.provider ?? null,
      external_id: input.external_id ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  if (input.category_id) {
    await supabaseAdmin
      .from('categories')
      .update({ last_used_at: data.created_at })
      .eq('id', input.category_id)
      .eq('user_id', userId);
  }

  const expenseDate: string = (data as { date: string }).date;
  triggerSheetSync(userId, expenseDate.slice(0, 7));

  return data;
};
