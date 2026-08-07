-- APEX: account auth fixes (delete account + username availability)
-- Depends on 004_hardening.sql and 005_usernames.sql

-- Ensure delete_user_account can reach auth.users under security definer.
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_user_account() from public;
grant execute on function public.delete_user_account() to authenticated;

-- Allow username availability checks to ignore the caller's current username.
drop function if exists public.is_username_available(text);

create or replace function public.is_username_available(
  username_input text,
  exclude_user_id uuid default null
)
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
      and (exclude_user_id is null or p.id <> exclude_user_id)
  );
end;
$$;

revoke all on function public.is_username_available(text, uuid) from public;
grant execute on function public.is_username_available(text, uuid) to anon, authenticated;
