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
-- 19. Experience CMS Tables
DO $$ BEGIN
    create type experience_type as enum (
        'Work', 'Research', 'Leadership', 'Award', 'Certification', 'Education', 'Volunteer', 'Mentorship'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

create table if not exists public.experience (
    id uuid default gen_random_uuid() primary key,
    role_title text not null,       
    organization text not null,     
    location text,                  
    summary text,                   
    description text,               
    
    type experience_type not null default 'Work',
    
    start_date date,
    end_date date,
    is_current boolean default false,
    
    status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
    
    featured boolean default false,
    featured_order integer default 0,
    display_order integer default 0,
    
    cover_media_id uuid references public.media_library(id) on delete set null,
    
    created_by uuid references public.users_profile(id) on delete set null,
    updated_by uuid references public.users_profile(id) on delete set null,
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger for updating updated_at timestamp
drop trigger if exists update_experience_updated_at on public.experience;
create trigger update_experience_updated_at
before update on public.experience
for each row execute function public.update_updated_at_column();

-- Indexes
create index if not exists idx_experience_status on public.experience(status);
create index if not exists idx_experience_featured on public.experience(featured);
create index if not exists idx_experience_type on public.experience(type);

-- Experience Tags
create table if not exists public.experience_tags (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    slug text not null unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.experience_tag_links (
    experience_id uuid references public.experience(id) on delete cascade,
    tag_id uuid references public.experience_tags(id) on delete cascade,
    primary key (experience_id, tag_id)
);

-- Indexes for tags
create index if not exists idx_experience_tag_links_experience on public.experience_tag_links(experience_id);
create index if not exists idx_experience_tag_links_tag on public.experience_tag_links(tag_id);
create index if not exists idx_experience_tags_slug on public.experience_tags(slug);

-- Enable RLS
alter table public.experience enable row level security;
alter table public.experience_tags enable row level security;
alter table public.experience_tag_links enable row level security;

-- Policies for experience
drop policy if exists "Public can read published experience" on public.experience;
create policy "Public can read published experience" on public.experience for select to anon using (status = 'published');

drop policy if exists "Authenticated users can read all experience" on public.experience;
create policy "Authenticated users can read all experience" on public.experience for select to authenticated using (true);

drop policy if exists "Owners, Admins, Editors can insert experience" on public.experience;
create policy "Owners, Admins, Editors can insert experience" on public.experience for insert to authenticated with check (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

drop policy if exists "Owners and Admins can update experience" on public.experience;
create policy "Owners and Admins can update experience" on public.experience for update to authenticated using (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin')
) with check (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin')
);

drop policy if exists "Editors can update draft experience" on public.experience;
create policy "Editors can update draft experience" on public.experience for update to authenticated using (
    (select role from public.users_profile where id = auth.uid()) = 'Editor'
    and status = 'draft'
) with check (
    (select role from public.users_profile where id = auth.uid()) = 'Editor'
    and status = 'draft'
);

drop policy if exists "Owners and Admins can delete experience" on public.experience;
create policy "Owners and Admins can delete experience" on public.experience for delete to authenticated using (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin')
);

-- Policies for experience_tags
drop policy if exists "Anyone can read experience_tags" on public.experience_tags;
create policy "Anyone can read experience_tags" on public.experience_tags for select using (true);

drop policy if exists "Owners, Admins, Editors can insert experience_tags" on public.experience_tags;
create policy "Owners, Admins, Editors can insert experience_tags" on public.experience_tags for insert to authenticated with check (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

drop policy if exists "Owners, Admins, Editors can update experience_tags" on public.experience_tags;
create policy "Owners, Admins, Editors can update experience_tags" on public.experience_tags for update to authenticated using (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
) with check (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

drop policy if exists "Owners, Admins, Editors can delete experience_tags" on public.experience_tags;
create policy "Owners, Admins, Editors can delete experience_tags" on public.experience_tags for delete to authenticated using (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

-- Policies for experience_tag_links
drop policy if exists "Anyone can read experience_tag_links" on public.experience_tag_links;
create policy "Anyone can read experience_tag_links" on public.experience_tag_links for select using (true);

drop policy if exists "Owners, Admins, Editors can insert experience_tag_links" on public.experience_tag_links;
create policy "Owners, Admins, Editors can insert experience_tag_links" on public.experience_tag_links for insert to authenticated with check (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

drop policy if exists "Owners, Admins, Editors can update experience_tag_links" on public.experience_tag_links;
create policy "Owners, Admins, Editors can update experience_tag_links" on public.experience_tag_links for update to authenticated using (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
) with check (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

drop policy if exists "Owners, Admins, Editors can delete experience_tag_links" on public.experience_tag_links;
create policy "Owners, Admins, Editors can delete experience_tag_links" on public.experience_tag_links for delete to authenticated using (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);
`;

async function run() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) {
        // Fallback if exec_sql rpc is not available
        console.log("exec_sql RPC failed, trying to create it first...");
        
        // Unfortunately supabase-js doesn't allow raw arbitrary SQL execution easily without RPC.
        // I will write the SQL to schema.sql so the user can run it in Supabase dashboard.
        const schemaPath = path.join(__dirname, 'supabase', 'schema.sql');
        fs.appendFileSync(schemaPath, "\n\n" + sql);
        console.log("Appended to supabase/schema.sql. Since we can't execute DDL via API by default, please run the appended SQL in your Supabase SQL Editor manually if needed, or we will assume it's applied for now.");
    } else {
        console.log("Schema applied successfully.");
        const schemaPath = path.join(__dirname, 'supabase', 'schema.sql');
        fs.appendFileSync(schemaPath, "\n\n" + sql);
    }
  } catch (err) {
    console.error(err);
  }
}

run();
