# Deploy APEX as a PWA

Step-by-step guide for production deployment. The build output is the **`dist/`** folder.

---

## Prerequisites

1. Supabase project with migrations applied (see `README.md`)
2. Git repo pushed to GitHub (recommended for Vercel/Netlify)
3. Environment variable values ready:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_SITE_URL` (your public URL, no trailing slash)

---

## Option A — Vercel (recommended)

### 1. Push code to GitHub

```bash
cd apex
git init   # if not already a repo
git add .
git commit -m "Initial APEX PWA"
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

### 2. Import project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Root Directory:** set to `apex` (if repo root is `D2`, not the repo itself)
4. **Framework Preset:** Other (Vercel reads `vercel.json`)

### 3. Environment variables

In Vercel → Project → Settings → Environment Variables, add:

| Name | Example |
|------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` |
| `EXPO_PUBLIC_SITE_URL` | `https://apex.yourdomain.com` |

Apply to **Production**, **Preview**, and **Development**.

### 4. Build settings (auto from `vercel.json`)

- **Build command:** `pnpm run vercel-build`
- **Output directory:** `.vercel/output`

Click **Deploy**. First build takes ~2–3 minutes.

### 5. Custom domain (optional)

1. Vercel → Project → Settings → Domains
2. Add your domain and follow DNS instructions
3. Update `EXPO_PUBLIC_SITE_URL` to match
4. Redeploy

### 6. Supabase auth URLs

Supabase Dashboard → **Authentication → URL Configuration**:

**Site URL:** `https://your-domain.com`

**Redirect URLs** (add all):

```
https://your-domain.com/auth/callback
https://your-domain.com/reset-password
apex://auth/callback
apex://reset-password
```

For Google OAuth, Google Cloud Console redirect URI stays:

```
https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
```

### 7. Verify PWA

1. Open `https://your-domain.com` in Chrome
2. DevTools → Application → Manifest (should show APEX icons)
3. DevTools → Application → Service Workers (should show `/sw.js`)
4. Install via Chrome address bar **Install APEX**

---

## Option B — Netlify

### 1. Push to GitHub (same as above)

### 2. Import site

1. [app.netlify.com/start](https://app.netlify.com/start) → Import from Git
2. Select repository
3. **Base directory:** `apex`
4. Netlify reads `netlify.toml` automatically:
   - Build: `npm run build:web`
   - Publish: `dist`

### 3. Environment variables

Netlify → Site → Site configuration → Environment variables:

Same three `EXPO_PUBLIC_*` variables as Vercel.

### 4. Deploy & configure auth

Deploy, add custom domain if needed, then configure Supabase redirect URLs (same as Vercel step 6).

---

## Local production test (before deploying)

```bash
cd apex
cp .env.example .env    # fill in Supabase keys
pnpm build:web
pnpm preview:web
```

Open the URL printed in the terminal (usually `http://localhost:8081`).

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank page after deploy | Check browser console; verify env vars were set **before** build |
| Google login fails | Supabase + Google Cloud redirect URIs must match exactly |
| `/exercises/uuid` 404 | Hosting rewrites required — use provided `vercel.json` / `netlify.toml` |
| **Vercel `404: NOT_FOUND` on homepage** | Build failed or wrong **Root Directory** — use `pnpm run vercel-build` |
| **Vercel warning: no `functions` or `static` directory** | Output must be `.vercel/output` with a `static/` folder — use `pnpm run vercel-build` (not plain `build:web` on Vercel) |
| **“No request logs found” in Vercel** | **Normal for this app.** APEX is a static PWA (no serverless functions). Request/Runtime logs only appear for API routes and SSR — not CDN static files. Use the browser + **Deployments → Output** tab instead. |
| PWA won't install | Must be HTTPS; need manifest + service worker + icons |
| Old version cached | Hard refresh; service worker updates on redeploy (`sw.js` has short cache headers) |
| Build fails on Workbox | Run `pnpm build:web` locally; needs network for `npx workbox-cli` first run |

---

## Fix: Vercel shows `404: NOT_FOUND`

This almost always means Vercel is not serving the `dist/` folder (build failed or wrong root).

### A. Check Root Directory (most common)

Vercel → Project → **Settings → General → Root Directory**

| What you pushed to GitHub | Root Directory setting |
|---------------------------|------------------------|
| Only the `apex/` folder | Leave **blank** (or `.`) |
| The whole `D2/` folder (parent of `apex`) | Set to **`apex`** |

### B. Check build settings

Settings → **Build & Development Settings** — should be:

| Setting | Value |
|---------|--------|
| Framework Preset | Other |
| Build Command | `pnpm run vercel-build` *(or leave empty to use `vercel.json`)* |
| Output Directory | `.vercel/output` |
| Install Command | `pnpm install` |

If Root Directory is `apex`, paths above are relative to `apex/`.

### C. Check the deployment log

1. Vercel → **Deployments** → click the latest deployment
2. Open **Building** logs
3. Look for red errors (failed `pnpm install`, failed `expo export`, etc.)

If build failed, fix the error, push, and redeploy.

### D. Redeploy

After fixing settings, go to **Deployments → ⋮ → Redeploy**.

---

## Re-deploy after changes

Any code change:

1. Push to GitHub
2. Vercel/Netlify auto-rebuilds (or trigger manual deploy)
3. Env var changes require a **new deploy** (they are baked in at build time for `EXPO_PUBLIC_*`)

---

## Manual / other hosts

Any static host that serves `dist/` over HTTPS:

```bash
cd apex
pnpm build:web
# Upload contents of dist/ to S3, Cloudflare Pages, Firebase Hosting, etc.
```

Configure SPA-style rewrites for dynamic routes (see `vercel.json` for patterns).
