-- APEX Phase 2: profiles table + auto-create on signup
-- Run via Supabase SQL editor or: supabase db push

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  unit_preference text not null default 'kg' check (unit_preference in ('kg', 'lb')),
  current_streak int not null default 0,
  longest_streak int not null default 0,
  total_xp int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Restricts SELECT to the authenticated user's own profile row.
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Restricts UPDATE to the authenticated user's own profile row.
-- INSERT is handled exclusively by handle_new_user() trigger, not the client.
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Auto-create profile when a new auth user signs up (never from client code)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
