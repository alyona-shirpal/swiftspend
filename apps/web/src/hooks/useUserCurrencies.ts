import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from './useAuth';

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
    queryKey: ['user-currencies'],
    queryFn: async () => {
      const { data } = await api.get<UserCurrencyResponse>('/user-currencies');
      return data;
    },
    enabled: !!user,
  });
}
