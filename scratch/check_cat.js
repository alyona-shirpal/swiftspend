const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategory() {
  const { data, error } = await supabase.from('categories').select('*').eq('id', 'ed38dd03-0dd3-4cf7-8e94-c7d43aedbfd0').single();
  console.log('Category check:', data, error);
}

checkCategory();
