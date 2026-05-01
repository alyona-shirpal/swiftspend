import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Development mode - bypass authentication if Supabase credentials are missing
const isDevelopment = !supabaseUrl || !supabaseAnonKey;

if (isDevelopment) {
  console.warn('Running in development mode - Supabase credentials missing. Authentication is disabled.');
}

export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'public-anon-key'
);
