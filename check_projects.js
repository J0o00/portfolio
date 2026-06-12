import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjects() {
  const { data, error } = await supabase.from('projects').select('id, title, slug, status');
  if (error) {
    console.error('Error fetching projects:', error);
  } else {
    console.log('Projects in Database:');
    console.table(data);
  }
}

checkProjects();
