-- APEX Phase 3: Row Level Security policies
-- Depends on 001_profiles_auth.sql and 002_schema.sql

-- ---------------------------------------------------------------------------
-- exercises
-- Shared library: all authenticated users can read.
-- Writes restricted to rows the user created (custom exercises only).
-- ---------------------------------------------------------------------------
alter table public.exercises enable row level security;

-- Allows any signed-in user to browse seeded and custom exercises.
create policy "exercises_select_authenticated"
  on public.exercises
  for select
  to authenticated
  using (true);

-- Restricts INSERT to custom exercises owned by the caller.
create policy "exercises_insert_own"
  on public.exercises
  for insert
  to authenticated
  with check (created_by = auth.uid() and is_custom = true);

-- Restricts UPDATE to custom exercises the caller created.
create policy "exercises_update_own"
  on public.exercises
  for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- Restricts DELETE to custom exercises the caller created.
create policy "exercises_delete_own"
  on public.exercises
  for delete
  to authenticated
  using (created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- routines
-- ---------------------------------------------------------------------------
alter table public.routines enable row level security;

create policy "routines_select_own"
  on public.routines
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "routines_insert_own"
  on public.routines
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "routines_update_own"
  on public.routines
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "routines_delete_own"
  on public.routines
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- routine_exercises (access via parent routine ownership)
-- ---------------------------------------------------------------------------
alter table public.routine_exercises enable row level security;

create policy "routine_exercises_select_own"
  on public.routine_exercises
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.routines r
      where r.id = routine_exercises.routine_id
        and r.user_id = auth.uid()
    )
  );

create policy "routine_exercises_insert_own"
  on public.routine_exercises
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.routines r
      where r.id = routine_exercises.routine_id
        and r.user_id = auth.uid()
    )
  );

create policy "routine_exercises_update_own"
  on public.routine_exercises
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.routines r
      where r.id = routine_exercises.routine_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.routines r
      where r.id = routine_exercises.routine_id
        and r.user_id = auth.uid()
    )
  );

create policy "routine_exercises_delete_own"
  on public.routine_exercises
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.routines r
      where r.id = routine_exercises.routine_id
        and r.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- workouts
-- ---------------------------------------------------------------------------
alter table public.workouts enable row level security;

create policy "workouts_select_own"
  on public.workouts
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "workouts_insert_own"
  on public.workouts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "workouts_update_own"
  on public.workouts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "workouts_delete_own"
  on public.workouts
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- workout_exercises (access via parent workout ownership)
-- ---------------------------------------------------------------------------
alter table public.workout_exercises enable row level security;

create policy "workout_exercises_select_own"
  on public.workout_exercises
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.workouts w
      where w.id = workout_exercises.workout_id
        and w.user_id = auth.uid()
    )
  );

create policy "workout_exercises_insert_own"
  on public.workout_exercises
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.workouts w
      where w.id = workout_exercises.workout_id
        and w.user_id = auth.uid()
    )
  );

create policy "workout_exercises_update_own"
  on public.workout_exercises
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.workouts w
      where w.id = workout_exercises.workout_id
        and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.workouts w
      where w.id = workout_exercises.workout_id
        and w.user_id = auth.uid()
    )
  );

create policy "workout_exercises_delete_own"
  on public.workout_exercises
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.workouts w
      where w.id = workout_exercises.workout_id
        and w.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- sets (access via workout_exercises → workouts join)
-- ---------------------------------------------------------------------------
alter table public.sets enable row level security;

create policy "sets_select_own"
  on public.sets
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = sets.workout_exercise_id
        and w.user_id = auth.uid()
    )
  );

create policy "sets_insert_own"
  on public.sets
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = sets.workout_exercise_id
        and w.user_id = auth.uid()
    )
  );

create policy "sets_update_own"
  on public.sets
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = sets.workout_exercise_id
        and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = sets.workout_exercise_id
        and w.user_id = auth.uid()
    )
  );

create policy "sets_delete_own"
  on public.sets
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = sets.workout_exercise_id
        and w.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- personal_records
-- ---------------------------------------------------------------------------
alter table public.personal_records enable row level security;

create policy "personal_records_select_own"
  on public.personal_records
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "personal_records_insert_own"
  on public.personal_records
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "personal_records_update_own"
  on public.personal_records
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "personal_records_delete_own"
  on public.personal_records
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- body_metrics
-- ---------------------------------------------------------------------------
alter table public.body_metrics enable row level security;

create policy "body_metrics_select_own"
  on public.body_metrics
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "body_metrics_insert_own"
  on public.body_metrics
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "body_metrics_update_own"
  on public.body_metrics
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "body_metrics_delete_own"
  on public.body_metrics
  for delete
  to authenticated
  using (auth.uid() = user_id);
