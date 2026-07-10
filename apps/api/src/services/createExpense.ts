import { Currency } from '../types';
import { createSupabaseUserClient } from './supabase';
import { ExchangeRateService } from './exchangeRate';
import { ensureUserCurrencies } from './userCurrencies';

export interface CreateExpenseInput {
  amount: number;
  currency: string;
  category_id?: string | null;
  description?: string;
  date?: string;
}

export const createExpenseRecord = async (
  accessToken: string,
  userId: string,
  input: CreateExpenseInput,
) => {
  const supabase = createSupabaseUserClient(accessToken);
  const currencies = await ensureUserCurrencies(userId, supabase);
  const userCurrencies = currencies.map((row) => row.currency as Currency);
  const snapshot = await ExchangeRateService.getCachedRates(supabase);
  const amounts = await ExchangeRateService.convertToUserCurrencies(
    input.amount,
    input.currency as Currency,
    userCurrencies,
    snapshot,
  );

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      category_id: input.category_id ?? null,
      description: input.description ?? null,
      date: input.date ?? new Date().toISOString().split('T')[0],
      amount: input.amount,
      currency: input.currency,
      amounts,
      exchange_rate_snapshot: snapshot,
    })
    .select()
    .single();

  if (error) throw error;

  if (input.category_id) {
    const { error: categoryError } = await supabase
      .from('categories')
      .update({ last_used_at: data.created_at })
      .eq('id', input.category_id)
      .eq('user_id', userId);
    if (categoryError) throw categoryError;
  }

  return data;
};
