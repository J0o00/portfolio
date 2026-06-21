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
-- 21. Education CMS Table
create table if not exists public.education (
    id uuid default gen_random_uuid() primary key,
    institution text not null,
    degree text,
    field_of_study text,
    cgpa text,
    start_date date,
    end_date date,
    description text,
    status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
    featured boolean default false,
    display_order integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Trigger for updating updated_at timestamp
drop trigger if exists update_education_updated_at on public.education;
create trigger update_education_updated_at
before update on public.education
for each row execute function public.update_updated_at_column();

-- Policies
alter table public.education enable row level security;
drop policy if exists "Public can read education" on public.education;
create policy "Public can read education" on public.education for select using (true);

drop policy if exists "Owners, Admins, Editors can insert education" on public.education;
create policy "Owners, Admins, Editors can insert education" on public.education for insert to authenticated with check (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

drop policy if exists "Owners, Admins, Editors can update education" on public.education;
create policy "Owners, Admins, Editors can update education" on public.education for update to authenticated using (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
) with check (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

drop policy if exists "Owners, Admins, Editors can delete education" on public.education;
create policy "Owners, Admins, Editors can delete education" on public.education for delete to authenticated using (
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
