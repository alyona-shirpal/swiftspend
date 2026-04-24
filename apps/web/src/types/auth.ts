import { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

export type AuthProvider = 'google' | 'apple' | 'github';

export interface AuthResponse {
  success: boolean;
  error?: string;
}
