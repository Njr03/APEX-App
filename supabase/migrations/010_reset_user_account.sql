-- APEX: reset account data (keep auth + profile, wipe training history)
-- Depends on 009_account_auth_fixes.sql

create or replace function public.reset_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.personal_records where user_id = uid;
  delete from public.body_metrics where user_id = uid;
  delete from public.workouts where user_id = uid;
  delete from public.routines where user_id = uid;
  delete from public.exercises where created_by = uid and is_custom = true;
end;
$$;

revoke all on function public.reset_user_account() from public;
grant execute on function public.reset_user_account() to authenticated;
