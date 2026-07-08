import axios from 'axios';
import { hasSupabaseServiceRoleKey, supabaseAdmin } from './supabase';
import { Currency } from '../types';
import type { RateSnapshot, CurrencyAmounts } from '@swiftspend/types';

interface ExchangeRateAPIResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
}

type SupabaseExchangeRateClient = Pick<typeof supabaseAdmin, 'from'>;

export class ExchangeRateService {
  // Using open.er-api.com with EUR base
  private static readonly API_URL = 'https://open.er-api.com/v6/latest/EUR';
  private static readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Fetch live exchange rates from the external API
   */
  private static async fetchRatesFromAPI(): Promise<Record<string, number>> {
    const response = await axios.get<ExchangeRateAPIResponse>(this.API_URL);
    return response.data.rates;
  }

  /**
   * Check cache or fetch new ones if stale
   */
  public static async getCachedRates(
    supabase: SupabaseExchangeRateClient = supabaseAdmin
  ): Promise<RateSnapshot> {
    const { data, error } = await supabase
      .from('exchange_rate_cache')
      .select('*')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    const now = new Date();

    if (!error && data) {
      const fetchedAt = new Date(data.fetched_at);
      const ageMs = now.getTime() - fetchedAt.getTime();

      // If fresh (< 1 hour), return cached
      if (ageMs < this.CACHE_TTL_MS) {
        return {
          base: (data.base ?? 'EUR') as unknown as RateSnapshot['base'],
          rates: data.rates as Record<string, number>,
          fetched_at: data.fetched_at
        };
      }
    }

    // Otherwise, fetch new rates
    const newRates = await this.fetchRatesFromAPI();

    if (!hasSupabaseServiceRoleKey) {
      return { base: Currency.EUR as unknown as RateSnapshot['base'], rates: newRates, fetched_at: now.toISOString() };
    }
    
    // Store in cache
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('exchange_rate_cache')
      .insert({ base: 'EUR', rates: newRates }) // Base is EUR
      .select()
      .single();

    if (insertError) {
      console.error('Failed to update exchange rate cache', insertError);
      return { base: Currency.EUR as unknown as RateSnapshot['base'], rates: newRates, fetched_at: now.toISOString() };
    }

    return {
      base: (inserted.base ?? 'EUR') as unknown as RateSnapshot['base'],
      rates: inserted.rates as Record<string, number>,
      fetched_at: inserted.fetched_at
    };
  }

  /**
   * Converts one amount+currency into all of the user's active currencies
   */
  public static async convertToUserCurrencies(
    amount: number,
    fromCurrency: Currency,
    userCurrencies: Currency[],
    snapshot: RateSnapshot
  ): Promise<CurrencyAmounts> {
    const fromRate = snapshot.rates[fromCurrency];
    if (!fromRate) throw new Error(`Missing rate for ${fromCurrency}`);

    const baseAmount = amount / fromRate; // base is EUR

    const result: CurrencyAmounts = {};
    for (const target of userCurrencies) {
      const targetRate = snapshot.rates[target];
      if (!targetRate) continue;
      result[target] = Number((baseAmount * targetRate).toFixed(2));
    }
    return result;
  }

  /**
   * Backfill: calculate one currency amount from an existing snapshot
   */
  public static calculateFromSnapshot(
    originalAmount: number,
    originalCurrency: Currency,
    targetCurrency: Currency,
    snapshot: RateSnapshot
  ): number {
    const originalRate = snapshot.rates[originalCurrency];
    const targetRate = snapshot.rates[targetCurrency];
    if (!originalRate) throw new Error(`Missing rate for ${originalCurrency}`);
    if (!targetRate) throw new Error(`Missing rate for ${targetCurrency}`);

    const baseAmount = originalAmount / originalRate;
    return Number((baseAmount * targetRate).toFixed(2));
  }
}
