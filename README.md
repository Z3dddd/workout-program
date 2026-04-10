# Workout Program Website

A static workout tracker site for a 12-week PPL (Push/Pull/Legs x2) bodybuilding program.  
It is optimized for mobile and desktop use, with target validation on iPhone 14 Pro and computer browsers.

## Project Structure

- `index.html` - main page markup
- `assets/css/styles.css` - styles and responsive rules
- `assets/js/data/weekData.js` - program data by week/day/exercise
- `assets/js/storage.js` - localStorage read/write helpers
- `assets/js/ui.js` - rendering and interaction logic
- `assets/js/app.js` - app bootstrap
- `backup/12_Week_PPL_Complete_Mobile.pre-refactor.html` - original single-file backup

## Run Locally

This is a static site. You can:

1. Open `index.html` directly in your browser, or
2. Serve with a simple local server:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Data Persistence

- Workout set inputs are saved in browser `localStorage`.
- Keys follow this pattern:
  - `w{week}_d{day}_e{exercise}_s{set}`
- Clearing an input removes that key from storage.

## GitHub Pages Deployment

Deployment is configured via `.github/workflows/pages.yml` using GitHub Actions.

### Required GitHub repository setting

In the repository settings:

- Go to **Settings -> Pages**
- Set **Source** to **GitHub Actions**

After pushing to `main`, the workflow deploys automatically.

## Device Support Targets

- iPhone 14 Pro (mobile-first layout and touch targets)
- Desktop browsers (wider layout and readability scaling)

## Screenshots

- Mobile (iPhone 14 Pro): _Add screenshot here_
- Desktop: _Add screenshot here_

## Rollback / Backup

If you need to restore the original version, use:

- `backup/12_Week_PPL_Complete_Mobile.pre-refactor.html`
