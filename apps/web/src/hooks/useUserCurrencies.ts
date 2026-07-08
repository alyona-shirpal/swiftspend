import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from './useAuth';

export const USER_CURRENCIES_QUERY_KEY = ['user-currencies'] as const;
export const USER_CURRENCIES_CACHE_TIME_MS = 5 * 60 * 1000;

export interface UserCurrency {
  id: string;
  user_id: string;
  currency: string;
  is_default: boolean;
  position: number;
  added_at: string;
}

export interface UserCurrencyResponse {
  needs_onboarding: boolean;
  needs_category_onboarding: boolean;
  currencies: UserCurrency[];
}

export function useUserCurrencies() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: USER_CURRENCIES_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get<UserCurrencyResponse>('/user-currencies');
      return data;
    },
    enabled: !!user,
    staleTime: USER_CURRENCIES_CACHE_TIME_MS,
  });
}
