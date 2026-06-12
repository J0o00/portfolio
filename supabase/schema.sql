-- Phase 1A Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Enums
create type user_role as enum ('Owner', 'Admin', 'Editor', 'Viewer');
create type user_status as enum ('Active', 'Suspended');

-- 2. Create Users Profile Table
create table public.users_profile (
    id uuid references auth.users(id) on delete cascade primary key,
    email text unique not null,
    role user_role default 'Viewer'::user_role not null,
    status user_status default 'Active'::user_status not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone,
    last_login timestamp with time zone,
    invited_by uuid references auth.users(id) on delete set null
);

-- 3. Create Site Profile Table (Single row)
create table public.site_profile (
    id integer primary key default 1,
    name text,
    headline text,
    bio text,
    profile_image_url text,
    profile_thumbnail_url text,
    cover_image text,
    resume_url text,
    email text,
    phone text,
    location text,
    hero_settings jsonb default '{}'::jsonb,
    about_settings jsonb default '{}'::jsonb,
    seo_settings jsonb default '{}'::jsonb,
    social_links jsonb default '{}'::jsonb,
    version integer default 1,
    updated_by uuid references public.users_profile(id) on delete set null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint single_row check (id = 1)
);

-- 4. Create Audit Logs Table
create table public.audit_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users_profile(id) on delete set null,
    action text not null,
    target text not null,
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Row Level Security (RLS) Policies
alter table public.users_profile enable row level security;
alter table public.site_profile enable row level security;
alter table public.audit_logs enable row level security;

-- Users Profile Policies
-- Users can read their own profile
create policy "Users can read own profile" on public.users_profile for select to authenticated using (
  id = auth.uid()
);
-- Owners and Admins can read all profiles
create policy "Owners and Admins can read all profiles" on public.users_profile for select to authenticated using (
  exists (
    select 1
    from public.users_profile up
    where up.id = auth.uid()
    and up.role in ('Owner', 'Admin')
  )
);
-- Only Owners and Admins can update/insert users_profile (simplified for initial setup)
create policy "Owners and Admins can update users_profile" on public.users_profile for update to authenticated using (
  (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin')
);
create policy "Owners and Admins can insert users_profile" on public.users_profile for insert to authenticated with check (
  (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin')
);
create policy "Owners and Admins can delete users_profile" on public.users_profile for delete to authenticated using (
  (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin')
);

-- Site Profile Policies (Public read, restricted write)
create policy "Anyone can read site_profile" on public.site_profile for select using (true);
create policy "Owner only update site_profile" on public.site_profile for update to authenticated using (
  exists (
    select 1
    from public.users_profile up
    where up.id = auth.uid()
    and up.role = 'Owner'
  )
);

-- Audit Logs Policies (Owners and Admins can read, Approved users insert)
create policy "Owners and Admins can read audit_logs" on public.audit_logs for select to authenticated using (
  (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin')
);
create policy "Approved users can insert audit logs" on public.audit_logs for insert to authenticated with check (
  exists (
    select 1
    from public.users_profile up
    where up.id = auth.uid()
    and up.status = 'Active'
  )
);

-- 6. Storage Buckets (Execute this via Supabase Dashboard UI manually, or via API)
-- insert into storage.buckets (id, name, public) values ('profile-assets', 'profile-assets', true);
-- insert into storage.buckets (id, name, public) values ('media-library', 'media-library', true);
-- etc.

-- 7. Owner Protection Trigger
create or replace function protect_last_owner()
returns trigger as $$
declare
    owner_count integer;
begin
    -- If we are updating a role from Owner to something else, or suspending an Owner
    if (TG_OP = 'UPDATE') then
        if (OLD.role = 'Owner' and (NEW.role != 'Owner' or NEW.status = 'Suspended')) then
            select count(*) into owner_count from public.users_profile where role = 'Owner' and status = 'Active' and id != OLD.id;
            if owner_count < 1 then
                raise exception 'Cannot remove the last active Owner account.';
            end if;
        end if;
    end if;
    
    -- If we are deleting an Owner
    if (TG_OP = 'DELETE') then
        if (OLD.role = 'Owner' and OLD.status = 'Active') then
            select count(*) into owner_count from public.users_profile where role = 'Owner' and status = 'Active' and id != OLD.id;
            if owner_count < 1 then
                raise exception 'Cannot delete the last active Owner account.';
            end if;
        end if;
    end if;
    
    return coalesce(NEW, OLD);
end;
$$ language plpgsql;

create trigger protect_owner_trigger
before update or delete on public.users_profile
for each row execute function protect_last_owner();

-- 8. Auto-create user profile on signup via Auth Trigger
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user cascade;

create or replace function public.handle_new_user()
returns trigger as $$
declare
    invite_record record;
begin
    if lower(trim(new.email)) = 'jovialjoyson@gmail.com' then
        insert into public.users_profile (id, email, role, status)
        values (new.id, new.email, 'Owner', 'Active')
        on conflict (id) do nothing;
    else
        -- Check if user is in user_invites (case-insensitive)
        select * into invite_record from public.user_invites where lower(email) = lower(trim(new.email));
        if found then
            insert into public.users_profile (id, email, role, status)
            values (new.id, new.email, invite_record.role, invite_record.status)
            on conflict (id) do nothing;
            
            -- Mark the invite as used to preserve the audit trail
            update public.user_invites set used_at = timezone('utc'::text, now()) where lower(email) = lower(trim(new.email));
        end if;
    end if;
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 9. Content Revisions Table
create table public.content_revisions (
    id uuid default uuid_generate_v4() primary key,
    content_type text not null,
    content_id uuid not null, -- Can be uuid or text depending on the target table's PK, using uuid for modules usually
    version integer not null,
    snapshot_json jsonb not null,
    created_by uuid references public.users_profile(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.content_revisions enable row level security;

-- Policies for content_revisions
create policy "Owners, Admins, Editors can read revisions" on public.content_revisions for select to authenticated using (
  (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

create policy "Approved users can insert revisions" on public.content_revisions for insert to authenticated with check (
  exists (
    select 1
    from public.users_profile up
    where up.id = auth.uid()
    and up.status = 'Active'
    and up.role in ('Owner', 'Admin', 'Editor')
  )
);

-- 10. Media Library
create table public.media_library (
    id uuid default gen_random_uuid() primary key,
    filename text not null,
    bucket text not null,
    storage_path text not null unique,
    asset_type text not null,
    mime_type text,
    file_size bigint,
    alt_text text,
    tags text[],
    status text default 'active',
    usage_count integer default 0,
    is_featured boolean default false,
    uploaded_by uuid references public.users_profile(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.media_library enable row level security;

-- Policies for media_library
create policy "Owners, Admins, Editors can read media_library" on public.media_library for select to authenticated using (
  (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

create policy "Owners, Admins, Editors can insert media_library" on public.media_library for insert to authenticated with check (
  (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

create policy "Owners and Admins can update media_library" on public.media_library for update to authenticated using (
  (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin')
);

-- 11. Role Hierarchy Enforcement Trigger
drop function if exists enforce_role_hierarchy cascade;
create or replace function enforce_role_hierarchy()
returns trigger as $$
declare
    current_user_role public.user_role;
begin
    -- Get the role of the user performing the update
    select role into current_user_role from public.users_profile where id = auth.uid();

    -- If the updater is an Admin, enforce restrictions
    if current_user_role = 'Admin' then
        -- 1. Admin cannot modify Owners or Admins
        if OLD.role in ('Owner', 'Admin') then
            raise exception 'Admins cannot modify Owners or Admins.';
        end if;
        -- 2. Admin cannot assign Owner or Admin
        if NEW.role in ('Owner', 'Admin') then
            raise exception 'Admins cannot assign Owner or Admin.';
        end if;
    end if;
    
    return coalesce(NEW, OLD);
end;
$$ language plpgsql;

create trigger enforce_role_hierarchy_trigger
before update on public.users_profile
for each row execute function enforce_role_hierarchy();

-- 3. User Invites (Whitelist) Table
create table if not exists public.user_invites (
    id uuid default gen_random_uuid() primary key,
    email text unique not null,
    role user_role not null default 'Viewer',
    status user_status not null default 'Active',
    invited_by uuid references public.users_profile(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    used_at timestamp with time zone
);

create unique index if not exists user_invites_email_lower_idx on public.user_invites (lower(email));

alter table public.user_invites enable row level security;

drop policy if exists "Owners and Admins can read user_invites" on public.user_invites;
create policy "Owners and Admins can read user_invites" on public.user_invites for select to authenticated using (
  (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin')
);

drop policy if exists "Owners and Admins can insert user_invites" on public.user_invites;
create policy "Owners and Admins can insert user_invites" on public.user_invites for insert to authenticated with check (
  (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin')
);

drop policy if exists "Owners and Admins can update user_invites" on public.user_invites;
create policy "Owners and Admins can update user_invites" on public.user_invites for update to authenticated using (
  (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin')
) with check (
  (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin')
);

drop policy if exists "Owners and Admins can delete user_invites" on public.user_invites;
create policy "Owners and Admins can delete user_invites" on public.user_invites for delete to authenticated using (
  (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin')
);

-- 13. Project Status Enum
DO $$ BEGIN
    create type project_status as enum ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 14. Projects Table
create table if not exists public.projects (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    slug text unique not null,
    excerpt text,
    short_description text,
    full_description text,
    status project_status default 'draft' not null,
    featured boolean default false,
    featured_order integer default 0,
    project_url text,
    github_url text,
    start_date date,
    end_date date,
    seo_title text,
    seo_description text,
    cover_media_id uuid references public.media_library(id) on delete set null,
    created_by uuid references public.users_profile(id) on delete set null,
    updated_by uuid references public.users_profile(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger for updating updated_at timestamp on projects
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists update_projects_updated_at on public.projects;
create trigger update_projects_updated_at
before update on public.projects
for each row execute function update_updated_at_column();

-- Editor Publish Protection Trigger
create or replace function enforce_project_publish_permissions()
returns trigger as $$
declare
    current_role public.user_role;
begin
    select role into current_role from public.users_profile where id = auth.uid();
    
    if current_role = 'Editor' then
        if OLD.status <> 'draft' or NEW.status <> 'draft' then
            raise exception 'Editors cannot publish or archive projects';
        end if;
    end if;
    
    return NEW;
end;
$$ language plpgsql;

drop trigger if exists enforce_project_publish on public.projects;
create trigger enforce_project_publish
before update on public.projects
for each row execute function enforce_project_publish_permissions();

-- Indexes for Projects
create index if not exists projects_status_idx on public.projects(status);
create index if not exists projects_featured_idx on public.projects(featured);
create index if not exists projects_slug_idx on public.projects(slug);

-- 15. Project Tags Table
create table if not exists public.project_tags (
    id uuid default gen_random_uuid() primary key,
    name text unique not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 16. Project Tag Links Table
create table if not exists public.project_tag_links (
    project_id uuid references public.projects(id) on delete cascade,
    tag_id uuid references public.project_tags(id) on delete cascade,
    primary key (project_id, tag_id)
);
create index if not exists project_tag_links_project_idx on public.project_tag_links(project_id);
create index if not exists project_tag_links_tag_idx on public.project_tag_links(tag_id);

-- 17. Project Media Table
create table if not exists public.project_media (
    id uuid default gen_random_uuid() primary key,
    project_id uuid references public.projects(id) on delete cascade,
    media_id uuid references public.media_library(id) on delete cascade,
    display_order integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index if not exists project_media_project_idx on public.project_media(project_id);
create index if not exists project_media_media_idx on public.project_media(media_id);

-- 18. RLS Policies for Projects

alter table public.projects enable row level security;
alter table public.project_tags enable row level security;
alter table public.project_tag_links enable row level security;
alter table public.project_media enable row level security;

-- Projects
drop policy if exists "Anyone can read published projects" on public.projects;
create policy "Anyone can read published projects" on public.projects for select using (status = 'published');

drop policy if exists "Authenticated users can read all projects" on public.projects;
create policy "Authenticated users can read all projects" on public.projects for select to authenticated using (true);

drop policy if exists "Owners, Admins, Editors can insert projects" on public.projects;
create policy "Owners, Admins, Editors can insert projects" on public.projects for insert to authenticated with check (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
    and (
        (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin') 
        or 
        ((select role from public.users_profile where id = auth.uid()) = 'Editor' and status = 'draft')
    )
);

drop policy if exists "Owners and Admins can update any project" on public.projects;
create policy "Owners and Admins can update any project" on public.projects for update to authenticated using (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin')
) with check (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin')
);

drop policy if exists "Editors can update draft projects" on public.projects;
create policy "Editors can update draft projects" on public.projects for update to authenticated using (
    (select role from public.users_profile where id = auth.uid()) = 'Editor'
    and status = 'draft'
) with check (
    (select role from public.users_profile where id = auth.uid()) = 'Editor'
    and status = 'draft'
);

drop policy if exists "Owners and Admins can delete projects" on public.projects;
create policy "Owners and Admins can delete projects" on public.projects for delete to authenticated using (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin')
);

-- Project Tags
drop policy if exists "Anyone can read project_tags" on public.project_tags;
drop policy if exists "Public can read tags used in published projects" on public.project_tags;
create policy "Public can read tags used in published projects" on public.project_tags for select to anon using (
    exists (
        select 1 from public.project_tag_links ptl
        join public.projects p on p.id = ptl.project_id
        where ptl.tag_id = project_tags.id and p.status = 'published'
    )
);

drop policy if exists "Authenticated users can read all project_tags" on public.project_tags;
create policy "Authenticated users can read all project_tags" on public.project_tags for select to authenticated using (true);

drop policy if exists "Owners, Admins, Editors can insert tags" on public.project_tags;
create policy "Owners, Admins, Editors can insert tags" on public.project_tags for insert to authenticated with check (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

drop policy if exists "Owners, Admins, Editors can update tags" on public.project_tags;
create policy "Owners, Admins, Editors can update tags" on public.project_tags for update to authenticated using (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

drop policy if exists "Owners, Admins can delete tags" on public.project_tags;
create policy "Owners, Admins can delete tags" on public.project_tags for delete to authenticated using (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin')
);

-- Project Tag Links
drop policy if exists "Anyone can read project_tag_links" on public.project_tag_links;
drop policy if exists "Public can read published project_tag_links" on public.project_tag_links;
create policy "Public can read published project_tag_links" on public.project_tag_links for select to anon using (
    exists (
        select 1 from public.projects p
        where p.id = project_tag_links.project_id and p.status = 'published'
    )
);

drop policy if exists "Authenticated users can read all project_tag_links" on public.project_tag_links;
create policy "Authenticated users can read all project_tag_links" on public.project_tag_links for select to authenticated using (true);

drop policy if exists "Owners, Admins, Editors can insert project_tag_links" on public.project_tag_links;
create policy "Owners, Admins, Editors can insert project_tag_links" on public.project_tag_links for insert to authenticated with check (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

drop policy if exists "Owners, Admins, Editors can update project_tag_links" on public.project_tag_links;
create policy "Owners, Admins, Editors can update project_tag_links" on public.project_tag_links for update to authenticated using (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

drop policy if exists "Owners, Admins, Editors can delete project_tag_links" on public.project_tag_links;
create policy "Owners, Admins, Editors can delete project_tag_links" on public.project_tag_links for delete to authenticated using (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

-- Project Media
drop policy if exists "Anyone can read project_media" on public.project_media;
drop policy if exists "Public can read published project_media" on public.project_media;
create policy "Public can read published project_media" on public.project_media for select to anon using (
    exists (
        select 1 from public.projects p
        where p.id = project_media.project_id and p.status = 'published'
    )
);

drop policy if exists "Authenticated users can read all project_media" on public.project_media;
create policy "Authenticated users can read all project_media" on public.project_media for select to authenticated using (true);

drop policy if exists "Owners, Admins, Editors can insert project_media" on public.project_media;
create policy "Owners, Admins, Editors can insert project_media" on public.project_media for insert to authenticated with check (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

drop policy if exists "Owners, Admins, Editors can update project_media" on public.project_media;
create policy "Owners, Admins, Editors can update project_media" on public.project_media for update to authenticated using (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);

drop policy if exists "Owners, Admins, Editors can delete project_media" on public.project_media;
create policy "Owners, Admins, Editors can delete project_media" on public.project_media for delete to authenticated using (
    (select role from public.users_profile where id = auth.uid()) in ('Owner', 'Admin', 'Editor')
);
