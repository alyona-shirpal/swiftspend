import axios from 'axios';
import { supabaseAdmin } from './supabase';
import { ConversionSnapshot, Currency } from '../types';

interface ExchangeRateAPIResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
}

export class ExchangeRateService {
  private static readonly API_URL = 'https://open.er-api.com/v6/latest/USD';
  private static readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  /**
   * Fetch live exchange rates from the external API
   */
  private static async fetchRatesFromAPI(): Promise<ConversionSnapshot> {
    const response = await axios.get<ExchangeRateAPIResponse>(this.API_URL);

    // openexchangerates base is USD by default.
    const rates = response.data.rates;

    // We only care about our 4 currencies.
    // If base is USD, rate for USD is 1. We just normalize it below if needed, 
    // but the snapshot will store rates relative to USD.
    const snapshot: ConversionSnapshot = {
      UAH: rates['UAH'] || 0,
      ALL: rates['ALL'] || 0,
      EUR: rates['EUR'] || 0,
      USD: rates['USD'] || 1, // Fallback if USD isn't explicitly returned
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
      .insert({ base: 'USD', rates: newRates }) // Base is USD for OpenExchangeRates
      .select()
      .single();

    if (insertError) {
      console.error('Failed to update exchange rate cache', insertError);
      // Even if cache fails to save, we can return the fetched rates
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
  public static convertAmount(amount: number, currency: Currency, rates: ConversionSnapshot) {
    // OpenExchangeRates uses USD as base.
    // To convert X logic: 
    // USD_Amount = amount / rate_of(currency)
    // Target_Amount = USD_Amount * rate_of(target_currency)

    const baseAmountUSD = amount / rates[currency];

    return {
      amount_uah: Number((baseAmountUSD * rates.UAH).toFixed(4)),
      amount_all: Number((baseAmountUSD * rates.ALL).toFixed(4)),
      amount_eur: Number((baseAmountUSD * rates.EUR).toFixed(4)),
      amount_usd: Number((baseAmountUSD * rates.USD).toFixed(4))
    };
  }
}
