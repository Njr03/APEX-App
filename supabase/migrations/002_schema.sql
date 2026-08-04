-- APEX Phase 3: core training schema
-- Depends on 001_profiles_auth.sql

-- ---------------------------------------------------------------------------
-- exercises (seeded library + user-created custom exercises)
-- ---------------------------------------------------------------------------
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text not null,
  equipment text,
  exercise_type text,
  is_custom boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  instructions text,
  created_at timestamptz not null default now()
);

create index if not exists exercises_muscle_group_idx on public.exercises (muscle_group);
create index if not exists exercises_name_idx on public.exercises (name);
create index if not exists exercises_created_by_idx on public.exercises (created_by);

-- ---------------------------------------------------------------------------
-- routines (reusable workout templates)
-- ---------------------------------------------------------------------------
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists routines_user_id_idx on public.routines (user_id);

-- ---------------------------------------------------------------------------
-- routine_exercises (exercises within a routine, ordered)
-- ---------------------------------------------------------------------------
create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  order_index int not null,
  target_sets int,
  target_reps int,
  target_weight numeric,
  unique (routine_id, order_index)
);

create index if not exists routine_exercises_routine_id_idx
  on public.routine_exercises (routine_id);

-- ---------------------------------------------------------------------------
-- workouts (logged sessions)
-- ---------------------------------------------------------------------------
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  routine_id uuid references public.routines (id) on delete set null,
  name text not null,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds int,
  total_volume numeric not null default 0,
  notes text
);

create index if not exists workouts_user_id_started_at_idx
  on public.workouts (user_id, started_at desc);
create index if not exists workouts_status_idx on public.workouts (status);

-- ---------------------------------------------------------------------------
-- workout_exercises (exercises within a session)
-- ---------------------------------------------------------------------------
create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  order_index int not null,
  notes text,
  unique (workout_id, order_index)
);

create index if not exists workout_exercises_workout_id_idx
  on public.workout_exercises (workout_id);

-- ---------------------------------------------------------------------------
-- sets (individual logged sets)
-- ---------------------------------------------------------------------------
create table if not exists public.sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null
    references public.workout_exercises (id) on delete cascade,
  set_number int not null,
  weight numeric,
  reps int,
  rpe numeric check (rpe is null or (rpe >= 1 and rpe <= 10)),
  is_warmup boolean not null default false,
  is_pr boolean not null default false,
  completed_at timestamptz,
  unique (workout_exercise_id, set_number)
);

create index if not exists sets_workout_exercise_id_idx
  on public.sets (workout_exercise_id);

-- ---------------------------------------------------------------------------
-- personal_records (derived, stored for fast queries)
-- ---------------------------------------------------------------------------
create table if not exists public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  record_type text not null
    check (record_type in ('max_weight', 'max_reps', 'max_volume', 'est_1rm')),
  value numeric not null,
  achieved_at timestamptz not null default now(),
  set_id uuid references public.sets (id) on delete set null,
  unique (user_id, exercise_id, record_type)
);

create index if not exists personal_records_user_id_idx
  on public.personal_records (user_id, achieved_at desc);
create index if not exists personal_records_exercise_id_idx
  on public.personal_records (exercise_id);

-- ---------------------------------------------------------------------------
-- body_metrics (optional bodyweight tracking)
-- ---------------------------------------------------------------------------
create table if not exists public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  weight numeric,
  notes text,
  unique (user_id, date)
);

create index if not exists body_metrics_user_id_date_idx
  on public.body_metrics (user_id, date desc);
