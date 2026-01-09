const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = serviceRoleKey && serviceRoleKey.startsWith('sb_secret_') ? serviceRoleKey : process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL e SUPABASE_KEY são obrigatórias');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
