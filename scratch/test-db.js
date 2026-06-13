import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials:", { supabaseUrl, supabaseKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: projData, error: projErr } = await supabase.from('projects').select('title,status').eq('status', 'published');
  console.log('Published projects count:', projData ? projData.length : 0);
  console.log('Projects:', projData);
  if (projErr) console.error("Proj Err:", projErr);

  const { data: resData, error: resErr } = await supabase.from('research').select('title,status').eq('status', 'published');
  console.log('Published research count:', resData ? resData.length : 0);
  console.log('Research:', resData);
  if (resErr) console.error("Res Err:", resErr);
}
run();
