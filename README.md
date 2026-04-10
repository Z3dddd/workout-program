# Workout Program Website

A static workout tracker site for a 12-week PPL (Push/Pull/Legs x2) bodybuilding program.  
It is optimized for mobile and desktop use, with target validation on iPhone 14 Pro and computer browsers.

## Project Structure

- `index.html` - main page markup
- `analysis.html` - dedicated progress analytics view
- `assets/css/styles.css` - styles and responsive rules
- `assets/css/analysis.css` - analysis page styling
- `assets/js/data/weekData.js` - program data by week/day/exercise
- `assets/js/storage.js` - localStorage read/write helpers
- `assets/js/supabase-config.js` - frontend Supabase runtime config placeholders
- `assets/js/sync.js` - pull/push sync client for Supabase Edge Function
- `assets/js/ui.js` - rendering and interaction logic
- `assets/js/app.js` - app bootstrap
- `assets/js/analysis.js` - analytics calculations and rendering
- `supabase/` - CLI config, migrations, and Edge Function source
- `backup/12_Week_PPL_Complete_Mobile.pre-refactor.html` - original single-file backup

## Run Locally

This is a static site. You can:

1. Open `index.html` directly in your browser, or
2. Serve with a simple local server:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Data Persistence (Local + Optional Cloud Sync)

- Workout set inputs are saved in browser `localStorage`.
- Keys follow this pattern:
  - `w{week}_d{day}_e{exercise}_s{set}`
- Clearing an input removes that key from storage.
- Optional Supabase sync lets data persist across devices/sessions using a PIN-protected function.

## Supabase Setup (CLI)

This project uses a no-auth sync model:

- Browser sends pull/push requests to `workout-sync` Edge Function.
- Edge Function validates a shared PIN and performs DB operations with service-role credentials.
- Browser has no direct table access.

### 1) Install and authenticate CLI

```bash
# Option A
scoop install supabase

# Option B
npm install supabase --save-dev
```

```bash
supabase login
supabase init
```

### 2) Link to your Supabase project

```bash
supabase link --project-ref <your_project_ref>
```

### 3) Database migrations

Migrations are already included in `supabase/migrations/`.

```bash
supabase db push
```

### 4) Configure Edge Function secrets

Set these in Supabase (never commit real secrets):

```bash
supabase secrets set SYNC_PIN=<your_pin>
supabase secrets set SUPABASE_URL=<your_project_url>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
```

### 5) Deploy function

```bash
supabase functions deploy workout-sync
```

For local testing:

```bash
supabase functions serve --env-file .env.local
```

### 6) Frontend config

Edit `assets/js/supabase-config.js` and set:

- `url`
- `anonKey`
- `functionName` (default `workout-sync`)

If config values are left empty, the app stays local-only.

## Sync UX Notes

- Tap `SET SYNC PIN` on main or analysis page.
- Use the same PIN on iPhone and desktop.
- Sync status badge shows `syncing`, `synced`, or `error`.
- If offline or sync fails, local storage remains available as fallback.

## GitHub Pages Deployment

Deployment is configured via `.github/workflows/pages.yml` using GitHub Actions.

### Required GitHub repository setting

In the repository settings:

- Go to **Settings -> Pages**
- Set **Source** to **GitHub Actions**

After pushing to `main`, the workflow deploys automatically.

## PIN Rotation / Recovery

- Rotate PIN: set a new `SYNC_PIN` secret and redeploy function.
- All devices must re-enter the new PIN.
- If PIN is forgotten, set a new one in Supabase secrets.

## Device Support Targets

- iPhone 14 Pro (mobile-first layout and touch targets)
- Desktop browsers (wider layout and readability scaling)

## Screenshots

- Mobile (iPhone 14 Pro): _Add screenshot here_
- Desktop: _Add screenshot here_

## Rollback / Backup

If you need to restore the original version, use:

- `backup/12_Week_PPL_Complete_Mobile.pre-refactor.html`
