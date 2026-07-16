import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { supabase } from '../services/supabase';
import { MerchantSuggestion } from '../types/api';

const normalizeMerchant = (value: string) => value.trim().toLowerCase();

export function useExpenseMerchantSuggestions(
  categoryId: string,
  merchant: string,
) {
  const normalizedMerchant = normalizeMerchant(merchant);
  const query = normalizedMerchant.length >= 2 ? normalizedMerchant : '';

  return useQuery({
    queryKey: ['expenses', 'merchant-suggestions', categoryId, query],
    enabled:
      Boolean(categoryId) &&
      (normalizedMerchant.length === 0 || normalizedMerchant.length >= 2),
    queryFn: async (): Promise<MerchantSuggestion[]> => {
      if (!supabase) {
        const mockSuggestions: MerchantSuggestion[] = [
          {
            merchant: 'Corner Market',
            normalized_merchant: 'corner market',
            count: 4,
            last_used_at: new Date().toISOString(),
          },
          {
            merchant: 'Coffee House',
            normalized_merchant: 'coffee house',
            count: 2,
            last_used_at: new Date().toISOString(),
          },
        ];

        return mockSuggestions.filter((suggestion) =>
          query ? suggestion.normalized_merchant.includes(query) : true,
        );
      }

      const searchParams = new URLSearchParams({
        category_id: categoryId,
        limit: '6',
      });
      if (query) searchParams.set('q', query);

      const { data } = await api.get<MerchantSuggestion[]>(
        `/expenses/merchant-suggestions?${searchParams}`,
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
