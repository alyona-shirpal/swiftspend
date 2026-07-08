import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client for the backend using Service Role Key
// Warning: Service Role bypasses RLS, so it should only be used carefully for internal tasks
// For user requests, we will validate the JWT at the middleware layer.
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const hasSupabaseServiceRoleKey =
  Boolean(supabaseKey) &&
  supabaseKey !== supabaseAnonKey &&
  !supabaseKey.startsWith('sb_publishable_');

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const createSupabaseUserClient = (accessToken: string) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
