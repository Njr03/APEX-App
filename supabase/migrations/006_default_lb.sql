-- Default new profiles to pounds; existing rows keep their saved preference.
alter table public.profiles
  alter column unit_preference set default 'lb';
