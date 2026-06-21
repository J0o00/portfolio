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
-- 22. Resume Uploads Table
create table if not exists public.resume_uploads (
    id uuid default gen_random_uuid() primary key,
    file_url text not null,
    original_filename text,
    extracted_text text,
    parsed_json jsonb,
    status text default 'uploaded',
    version integer default 1,
    uploaded_at timestamptz default now()
);

-- Policies
alter table public.resume_uploads enable row level security;

drop policy if exists "Owners, Admins, Editors can read resume_uploads" on public.resume_uploads;
create policy "Owners, Admins, Editors can read resume_uploads" on public.resume_uploads for select to authenticated using (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

drop policy if exists "Owners, Admins, Editors can insert resume_uploads" on public.resume_uploads;
create policy "Owners, Admins, Editors can insert resume_uploads" on public.resume_uploads for insert to authenticated with check (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

drop policy if exists "Owners, Admins, Editors can update resume_uploads" on public.resume_uploads;
create policy "Owners, Admins, Editors can update resume_uploads" on public.resume_uploads for update to authenticated using (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
) with check (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

drop policy if exists "Owners, Admins, Editors can delete resume_uploads" on public.resume_uploads;
create policy "Owners, Admins, Editors can delete resume_uploads" on public.resume_uploads for delete to authenticated using (
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
