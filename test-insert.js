import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const extractEnv = (key) => {
  const line = envContent.split('\n').find(l => l.startsWith(key + '='));
  return line ? line.split('=')[1].trim() : null;
};

const SUPABASE_URL = extractEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = extractEnv('VITE_SUPABASE_ANON_KEY');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testInsert() {
  const { data: { user } } = await supabase.auth.getUser();
  // We can't easily get the user without auth token, so let's just insert with a dummy or fetch the first user
  
  // Actually, we can just login if we had credentials, but we don't.
  // We can just try to insert without auth to see the schema error, it might say "unauthorized" though.
}
testInsert();
