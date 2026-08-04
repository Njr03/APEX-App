-- APEX Phase 8: RLS hardening + account deletion RPC
-- Depends on 003_rls.sql

-- Tighten custom-exercise write policies (match INSERT guard).
drop policy if exists "exercises_update_own" on public.exercises;
drop policy if exists "exercises_delete_own" on public.exercises;

create policy "exercises_update_own"
  on public.exercises
  for update
  to authenticated
  using (created_by = auth.uid() and is_custom = true)
  with check (created_by = auth.uid() and is_custom = true);

create policy "exercises_delete_own"
  on public.exercises
  for delete
  to authenticated
  using (created_by = auth.uid() and is_custom = true);

-- Self-service account deletion.
-- Deletes auth.users row for the caller; ON DELETE CASCADE removes public.profiles
-- and all user-owned training data via foreign keys.
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
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
