const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../apps/api/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('Checking categories...');
  const { data: categories, error: catError } = await supabase.from('categories').select('count');
  console.log('Total categories in DB:', categories);

  console.log('Checking expenses...');
  const { data: expenses, error: expError } = await supabase.from('expenses').select('*').limit(5);
  console.log('Recent expenses in DB:', expenses);
  
  if (expenses && expenses.length > 0) {
    console.log('User ID of first expense:', expenses[0].user_id);
  }
}

checkData();
