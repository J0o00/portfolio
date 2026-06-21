import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
-- 20. Skills CMS Table
create table if not exists public.skills (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    slug text unique,
    category text,
    proficiency integer,
    featured boolean default false,
    display_order integer default 0,
    description text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Trigger for updating updated_at timestamp
drop trigger if exists update_skills_updated_at on public.skills;
create trigger update_skills_updated_at
before update on public.skills
for each row execute function public.update_updated_at_column();

-- Policies
alter table public.skills enable row level security;
drop policy if exists "Public can read skills" on public.skills;
create policy "Public can read skills" on public.skills for select using (true);

drop policy if exists "Owners, Admins, Editors can insert skills" on public.skills;
create policy "Owners, Admins, Editors can insert skills" on public.skills for insert to authenticated with check (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

drop policy if exists "Owners, Admins, Editors can update skills" on public.skills;
create policy "Owners, Admins, Editors can update skills" on public.skills for update to authenticated using (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
) with check (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

drop policy if exists "Owners, Admins, Editors can delete skills" on public.skills;
create policy "Owners, Admins, Editors can delete skills" on public.skills for delete to authenticated using (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);
`;

async function run() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) {
        console.log("exec_sql RPC failed, trying to create it first...");
        // Assuming we need to append to schema.sql
        const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
        fs.appendFileSync(schemaPath, "\n\n" + sql);
        console.log("Appended to supabase/schema.sql. Please run it in your Supabase SQL Editor manually.");
    } else {
        console.log("Schema applied successfully.");
        const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
        fs.appendFileSync(schemaPath, "\n\n" + sql);
    }
  } catch (err) {
    console.error(err);
  }
}

run();
