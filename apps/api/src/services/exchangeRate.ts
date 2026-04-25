import axios from 'axios';
import { supabaseAdmin } from './supabase';
import { ConversionSnapshot, Currency } from '../types';

interface ExchangeRateAPIResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
}

export interface RateSnapshot {
  base: 'EUR';
  rates: ConversionSnapshot;
  fetched_at: string;
}

export class ExchangeRateService {
  // Using open.er-api.com with EUR base
  private static readonly API_URL = 'https://open.er-api.com/v6/latest/EUR';
  private static readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Fetch live exchange rates from the external API
   */
  private static async fetchRatesFromAPI(): Promise<ConversionSnapshot> {
    const response = await axios.get<ExchangeRateAPIResponse>(this.API_URL);
    const rates = response.data.rates;

    const snapshot: ConversionSnapshot = {
      UAH: rates['UAH'] || 0,
      ALL: rates['ALL'] || 0,
      EUR: rates['EUR'] || 1, // Base is EUR
      USD: rates['USD'] || 0,
    };

    return snapshot;
  }

  /**
   * Check cache or fetch new ones if stale
   */
  public static async getCachedRates(): Promise<{ rates: ConversionSnapshot; fetchedAt: string }> {
    const { data, error } = await supabaseAdmin
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
          rates: data.rates as ConversionSnapshot,
          fetchedAt: data.fetched_at
        };
      }
    }

    // Otherwise, fetch new rates
    const newRates = await this.fetchRatesFromAPI();
    
    // Store in cache
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('exchange_rate_cache')
      .insert({ base: 'EUR', rates: newRates }) // Base is EUR
      .select()
      .single();

    if (insertError) {
      console.error('Failed to update exchange rate cache', insertError);
      return { rates: newRates, fetchedAt: now.toISOString() };
    }

    return {
      rates: inserted.rates as ConversionSnapshot,
      fetchedAt: inserted.fetched_at
    };
  }

  /**
   * Convert amount across all 4 currencies
   */
  public static convertToAll(amount: number, currency: Currency, rates: ConversionSnapshot) {
    // Base is EUR
    const baseAmountEUR = amount / rates[currency];

    return {
      amount_uah: Number((baseAmountEUR * rates.UAH).toFixed(4)),
      amount_all: Number((baseAmountEUR * rates.ALL).toFixed(4)),
      amount_eur: Number((baseAmountEUR * rates.EUR).toFixed(4)),
      amount_usd: Number((baseAmountEUR * rates.USD).toFixed(4)),
      exchange_rate_snapshot: {
        base: 'EUR',
        rates,
        fetched_at: new Date().toISOString()
      }
    };
  }
}
