# APEX

Gamified strength training journal for iOS, Android, and Web.

## Stack

- **Expo** (React Native) + **Expo Router** + TypeScript (strict)
- **NativeWind** (Tailwind CSS)
- **Supabase** (Auth, Postgres, RLS)
- **TanStack Query**, **Zustand**, **React Hook Form** + **Zod**
- **react-native-gifted-charts**, **lucide-react-native**, **date-fns**

## Getting started

```bash
cd apex
pnpm install
cp .env.example .env   # add your Supabase URL + anon key
pnpm start
```

Use `pnpm ios`, `pnpm android`, or `pnpm web` to open a platform.

## Environment variables

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |

**Never** put the Supabase service role key in client code or `EXPO_PUBLIC_*` variables.

### Supabase Auth setup

1. Run `supabase/migrations/001_profiles_auth.sql` in the Supabase SQL editor (or via CLI).
2. In **Authentication → URL Configuration**, add redirect URLs:
   - `apex://auth/callback` (native)
   - `http://localhost:8081/auth/callback` (local web — adjust port if needed)
   - `apex://reset-password` (native)
   - `http://localhost:8081/reset-password` (local web)
3. Enable email confirmation in Auth settings if you want the verify-email flow.
4. **Google sign-in** (required for “Continue with Google”):

   **Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com/)):
   - Create or select a project.
   - **APIs & Services → OAuth consent screen** — configure app name, support email, and (if in *Testing*) add your Gmail under **Test users**.
   - **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorized redirect URIs** — add exactly:
     ```
     https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
     ```
     For this project that is:
     ```
     https://xwjeiknhxqxvwczjhmjp.supabase.co/auth/v1/callback
     ```
   - Copy the **Client ID** and **Client secret**.

   **Supabase Dashboard** → **Authentication → Providers → Google**:
   - Enable Google.
   - Paste the Client ID and Client secret (no extra spaces).
   - Save.

   **Supabase Dashboard** → **Authentication → URL Configuration → Redirect URLs** — add every URL your app uses after sign-in:
   - `apex://auth/callback` (iOS/Android)
   - `http://localhost:8081/auth/callback` (Expo web — match your dev port)
   - Your production URL, e.g. `https://yourdomain.com/auth/callback`

   If Google shows *“Access blocked: This app's request is invalid”*, the redirect URI in Google Cloud almost always does not **exactly** match the Supabase callback URL above, or the OAuth client is not type **Web application**.

### Database setup

Run migrations in order (see `supabase/README.md`):

1. `supabase/migrations/001_profiles_auth.sql`
2. `supabase/migrations/002_schema.sql`
3. `supabase/migrations/003_rls.sql`
4. `supabase/seed/exercises.sql`

Regenerate types after schema changes:

```bash
SUPABASE_PROJECT_ID=your-project-ref pnpm db:types
```

## Data layer

React Query hooks live in `hooks/queries/`:

- `useProfile`, `useUpdateProfile`
- `useExercises`, `useExercise`, `useCreateExercise`, …
- `useRoutines`, `useRoutine`, `useUpsertRoutineExercises`, …
- `useWorkouts`, `useActiveWorkout`, `useWorkout`, …
- `useSets`, `useCreateSet`, `useUpdateSet`, `useUpsertSet`
- `usePersonalRecords`, `useRecentPersonalRecords`, …
- `useBodyMetrics`, `useUpsertBodyMetric`, …

All mutations validate input with Zod schemas in `lib/validations/training.ts` before hitting Supabase.

## Project structure

```
app/
  (auth)/          # Sign up, log in, forgot password
  (tabs)/          # Home, Workouts, Exercises, Progress, Profile
  workout/         # Active session + summary
  exercises/       # Detail + custom exercise form
  routines/        # List, builder, detail
  history/         # Calendar + session detail
components/ui/     # Shared UI primitives
lib/supabase/      # Typed Supabase client + database types
hooks/queries/     # TanStack Query hooks per table
constants/theme.ts # Design tokens
```

## Deploy as a Progressive Web App (PWA)

Full step-by-step instructions: **[DEPLOY.md](./DEPLOY.md)** (Vercel, Netlify, Supabase auth, troubleshooting).

Agent/onboarding guide for AI edits: **[AGENTS.md](./AGENTS.md)**.

Quick build:

```bash
cd apex
pnpm install
cp .env.example .env   # set EXPO_PUBLIC_SUPABASE_URL + anon key
pnpm build:web         # outputs to dist/
pnpm preview:web       # serve dist/ locally
```

Open the preview URL in Chrome, then use **Install APEX** from the address bar (or browser menu) to test installation.

### Deploy

The `dist/` folder is the deploy target. Config is included for:

- **Vercel** — import the repo; `vercel.json` runs `npm run build:web` and publishes `dist/`
- **Netlify** — `netlify.toml` does the same

Set environment variables on your host:

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `EXPO_PUBLIC_SITE_URL` | Public site URL (no trailing slash), e.g. `https://apex.example.com` |

In **Supabase → Authentication → URL Configuration**, add your production redirect URLs:

- `https://your-domain.com/auth/callback`
- `https://your-domain.com/reset-password`

### PWA files

| Path | Purpose |
|---|---|
| `public/manifest.json` | Install name, colors, icons |
| `public/pwa-192.png`, `public/pwa-512.png` | Home-screen icons |
| `workbox-config.js` | Service worker generation after export |
| `app/+html.tsx` | Manifest link + service worker registration |

Regenerate icons after changing `assets/images/icon.png`:

```bash
bash scripts/generate-pwa-icons.sh
```

## Build phases

1. **Scaffold** — project setup, theme, navigation shell, Supabase client
2. **Auth** — Supabase Auth, session gating, profile trigger
3. **Data layer** — SQL migration, RLS, React Query hooks
4. **Core workout loop** — Active workout, PR detection, summary
5. **Routines + Exercise Library**
6. **History + Progress**
7. **Gamification polish**
8. **Hardening**
