# Supabase migrations

Run these in order in the Supabase SQL editor (or via `supabase db push`).

| Order | File | Purpose |
|------:|------|---------|
| 1 | `migrations/001_profiles_auth.sql` | Profiles table, RLS, signup trigger |
| 2 | `migrations/002_schema.sql` | Exercises, routines, workouts, sets, PRs, body metrics |
| 3 | `migrations/003_rls.sql` | Row Level Security on all tables |
| 4 | `migrations/004_hardening.sql` | Exercise RLS tighten + `delete_user_account()` RPC |
| 5 | `migrations/005_usernames.sql` | Usernames + login lookup helpers |
| 6 | `migrations/009_account_auth_fixes.sql` | Fix account deletion RPC + username availability |
| 7 | `seed/exercises.sql` | ~40 seeded strength exercises + extended library |

## RLS summary

| Table | Read | Write |
|-------|------|-------|
| `profiles` | Own row | Update own row (insert via trigger only) |
| `exercises` | All authenticated | Custom exercises where `created_by = auth.uid()` |
| `routines` | Own rows | Own rows |
| `routine_exercises` | Via parent routine | Via parent routine |
| `workouts` | Own rows | Own rows |
| `workout_exercises` | Via parent workout | Via parent workout |
| `sets` | Via workout join | Via workout join |
| `personal_records` | Own rows | Own rows |
| `body_metrics` | Own rows | Own rows |

All client access uses the **anon key** with RLS — never the service role key in the app.

Account deletion uses the `delete_user_account()` RPC (migration 004), which runs as `security definer` and deletes the caller's `auth.users` row. Profile and training data cascade via foreign keys.

## Regenerate TypeScript types

After schema changes, regenerate types from your linked project:

```bash
SUPABASE_PROJECT_ID=your-project-ref pnpm db:types
```

The repo ships hand-maintained types in `lib/supabase/database.types.ts` that match this schema.
