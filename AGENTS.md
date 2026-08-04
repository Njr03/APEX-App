# APEX — Agent Guide

This document helps AI agents (and humans) safely modify and deploy the APEX strength-training app.

## Project layout

```
D2/
  .cursor/rules/          # Cursor agent rules (always read)
  apex/                   # ← THE APP — all source code lives here
    app/                  # Expo Router screens (file-based routes)
    components/           # UI by feature (dashboard, workout, ui, …)
    hooks/                # React hooks + hooks/queries/ (TanStack Query)
    lib/                  # Business logic, Supabase, validations, training utils
    stores/               # Zustand (navigation, dashboard cards, …)
    constants/theme.ts    # Colors, fonts — design source of truth
    public/               # Static PWA assets (copied to dist/ on export)
    supabase/             # SQL migrations + seed
    app.json              # Expo config (incl. web/PWA metadata)
    package.json          # Scripts + dependencies (packageManager: pnpm)
    dist/                 # Generated web build — DO NOT EDIT
```

**Never edit `dist/` or `node_modules/`.** Regenerate with `pnpm build:web`.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Expo ~56, React Native 0.85, Expo Router ~56 |
| Styling | NativeWind 4 (Tailwind), `global.css` for web-only CSS |
| Backend | Supabase (Auth, Postgres, RLS) |
| Client data | TanStack Query (`hooks/queries/`) |
| Local UI state | Zustand (`stores/`) |
| Forms | React Hook Form + Zod (`lib/validations/training.ts`) |

Official Expo docs for this SDK: https://docs.expo.dev/versions/v56.0.0/

## Environment

Copy `apex/.env.example` → `apex/.env`:

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (never service role) |
| `EXPO_PUBLIC_SITE_URL` | Optional; OAuth redirect base on web |

## Development

```bash
cd apex
pnpm install
cp .env.example .env
pnpm web          # primary dev target (user tests on web)
pnpm start        # Expo dev menu (all platforms)
npx tsc --noEmit  # typecheck before finishing
```

## Architecture notes

### Routing (`app/`)

- `(tabs)/` — main shell: Home, Workouts, Exercises, Progress, Profile
- `(auth)/` — login, signup, forgot password
- `workout/active`, `workout/confirm` — live session flow
- Dynamic routes: `exercises/[id]/`, `routines/[id]/`, etc.

### Data flow

1. Screen/component calls hook from `hooks/queries/`
2. Hook uses `supabase` client (`lib/supabase/client.ts`)
3. Mutations validate with Zod, invalidate query keys (`hooks/queries/queryKeys.ts`)
4. Errors surfaced via `getSupabaseErrorMessage()` (`lib/supabase/errors.ts`)

### Dashboard workout cards

Shared visual: `components/dashboard/DashboardWorkoutCard.tsx`

- Split cards: `WeekSplitCard` + `useThisWeekSplits`
- Saved routines: `DashboardRoutineCard` + `buildRoutineCardModel()` in `lib/dashboard/routineCardDisplay.ts`
- Muscle subtitles: `lib/training/targetMuscles.ts` (from exercise `muscle_group`)
- Hover outline: `lib/dashboard/cardStyles.ts` + `.week-split-card` in `global.css`

### Workouts tab

- Saved workout row: `components/workout/SavedWorkoutCardsRow.tsx`
- History panels: `components/workout/WorkoutHistoryChart.tsx`

### Exercise library

- List: `app/(tabs)/exercises.tsx`
- Custom CRUD: `app/exercises/new.tsx`, `app/exercises/[id]/edit.tsx`
- Shared form: `components/exercises/CustomExerciseForm.tsx`
- Delete confirm: `lib/confirmAction.ts` (web-safe)

### Top bar CTAs

`components/navigation/AppTopBar.tsx` — hidden on index, workouts, exercises, progress tabs.

## UI conventions

- Dark theme only; bg `#0a0a0f`, accent `#c8ff5a`
- Section labels: `InsightSectionHeading` (JetBrains Mono 11px, muted)
- Prefer reusing `components/ui/*` (Button, Card, Screen, Input, …)
- Web hover on cards: full-height green border; avoid `overflow: hidden` on outer hover wrapper
- Keep diffs focused; don't refactor unrelated code

## PWA / Web production

Static export configured in `app.json` (`web.output: "static"`).

```bash
pnpm build:web     # export + Workbox service worker
pnpm preview:web   # serve dist/ locally
```

Deploy `dist/` — see **`DEPLOY.md`** for Vercel/Netlify steps.

PWA files:

- `public/manifest.json`, `public/pwa-*.png`
- `app/+html.tsx` — manifest link, meta, SW registration
- `workbox-config.js` — run after export
- `vercel.json` / `netlify.toml` — hosting + dynamic route rewrites

## Database

Migrations in `supabase/migrations/` (run in order). Regenerate types:

```bash
SUPABASE_PROJECT_ID=your-ref pnpm db:types
```

## Git

- Do **not** create commits or PRs unless the user explicitly requests it.
- `dist/` is gitignored.

## Common tasks

| Task | Where to look |
|------|----------------|
| Add dashboard card behavior | `ThisWeekSection.tsx`, `dashboardCardsStore.ts` |
| Change workout card layout | `DashboardWorkoutCard.tsx` |
| Add Supabase query | `hooks/queries/use*.ts`, `queryKeys.ts` |
| New screen | `app/` + register in `app/_layout.tsx` if needed |
| PWA / deploy change | `DEPLOY.md`, `public/`, `app/+html.tsx` |
| Auth redirect URLs | Supabase dashboard + `.env.example` |

## When stuck

1. Search the codebase for an existing pattern (grep by feature name).
2. Run `npx tsc --noEmit`.
3. Check Supabase RLS if mutations fail silently.
4. On web, avoid `Alert.alert` — use `confirmDestructiveAction`.
