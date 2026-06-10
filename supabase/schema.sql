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
create or replace function public.handle_new_user()
returns trigger as $$
begin
  if new.email = 'jovialjoyson@gmail.com' then
    insert into public.users_profile (id, email, role, status)
    values (new.id, new.email, 'Owner', 'Active');
  else
    -- Everyone else starts as a Viewer, or you can omit this else block entirely
    -- if you strictly want to prevent any profiles from being created unless added by an admin.
    -- Since the requirement is an explicit whitelist, it's safer NOT to insert non-owners automatically.
    -- But for now we will just not insert anything for other users, so they get access denied.
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
