import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client for the backend using Service Role Key
// Warning: Service Role bypasses RLS, so it should only be used carefully for internal tasks
// For user requests, we will validate the JWT at the middleware layer.
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
