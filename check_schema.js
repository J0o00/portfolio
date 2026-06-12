import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  const projectId = 'ec12b815-3705-49ae-a823-0dfcc57f0de2';
  const { data, error } = await supabase
    .from('content_revisions')
    .select('version')
    .eq('content_id', projectId)
    .eq('content_type', 'project')
    .order('version', { ascending: false })
    .limit(1);

  console.log('Error:', error);
}

checkTable();
