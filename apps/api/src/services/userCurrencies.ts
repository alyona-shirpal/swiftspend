import { Currency } from '@swiftspend/types';
import { supabaseAdmin } from './supabase';

type UserCurrencyRow = {
  id: string;
  user_id: string;
  currency: Currency;
  is_default: boolean;
  position: number;
  added_at: string;
};

const DEFAULT_USER_CURRENCIES: Array<Pick<UserCurrencyRow, 'currency' | 'is_default' | 'position'>> = [
  { currency: Currency.EUR, is_default: true, position: 0 },
  { currency: Currency.USD, is_default: false, position: 1 },
  { currency: Currency.UAH, is_default: false, position: 2 },
  { currency: Currency.ALL, is_default: false, position: 3 },
];

export async function ensureUserCurrencies(userId: string): Promise<UserCurrencyRow[]> {
  const { data: existing, error } = await supabaseAdmin
    .from('user_currencies')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true });

  if (error) throw error;

  if (!existing || existing.length === 0) {
    const seedRows = DEFAULT_USER_CURRENCIES.map((row) => ({
      user_id: userId,
      currency: row.currency,
      is_default: row.is_default,
      position: row.position,
    }));

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('user_currencies')
      .insert(seedRows)
      .select('*');

    if (insertError) throw insertError;
    return ((inserted ?? []) as UserCurrencyRow[]).sort((a, b) => a.position - b.position);
  }

  const rows = existing as UserCurrencyRow[];
  if (rows.some((row) => row.is_default)) {
    return rows;
  }

  const preferredDefault = rows.find((row) => row.currency === Currency.EUR) ?? rows[0];
  if (!preferredDefault) {
    return rows;
  }

  const { error: updateError } = await supabaseAdmin
    .from('user_currencies')
    .update({ is_default: true })
    .eq('id', preferredDefault.id)
    .eq('user_id', userId);

  if (updateError) throw updateError;

  return rows.map((row) => ({
    ...row,
    is_default: row.id === preferredDefault.id,
  }));
}
