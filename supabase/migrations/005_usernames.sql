-- APEX: usernames + login lookup helpers
-- Depends on 001_profiles_auth.sql

alter table public.profiles
  add column if not exists username text;

-- Backfill existing rows with a unique placeholder username.
update public.profiles
set username = lower(
  regexp_replace(
    coalesce(nullif(trim(display_name), ''), split_part(
      (select email from auth.users where id = profiles.id),
      '@',
      1
    ) ),
    '[^a-zA-Z0-9_]',
    '',
    'g'
  )
) || '_' || substr(replace(id::text, '-', ''), 1, 6)
where username is null;

alter table public.profiles
  alter column username set not null;

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

-- Resolve username or email to an auth email for password login.
create or replace function public.resolve_login_email(identifier text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized text := lower(trim(identifier));
  resolved_email text;
begin
  if normalized = '' then
    return null;
  end if;

  if position('@' in normalized) > 0 then
    return normalized;
  end if;

  select u.email
  into resolved_email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = normalized;

  return resolved_email;
end;
$$;

revoke all on function public.resolve_login_email(text) from public;
grant execute on function public.resolve_login_email(text) to anon, authenticated;

-- Check username availability before signup.
create or replace function public.is_username_available(username_input text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := lower(trim(username_input));
begin
  if normalized is null or length(normalized) < 3 then
    return false;
  end if;

  return not exists (
    select 1
    from public.profiles p
    where lower(p.username) = normalized
  );
end;
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_username text := lower(trim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  base_username text;
  final_username text;
begin
  if raw_username = '' then
    base_username := lower(
      regexp_replace(
        split_part(coalesce(new.email, 'user'), '@', 1),
        '[^a-zA-Z0-9_]',
        '',
        'g'
      )
    );
    if base_username = '' or length(base_username) < 3 then
      base_username := 'user';
    end if;
    final_username := base_username || '_' || substr(replace(new.id::text, '-', ''), 1, 6);
  else
    final_username := raw_username;
  end if;

  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(coalesce(new.email, 'user'), '@', 1)
    ),
    final_username
  );

  return new;
end;
$$;
