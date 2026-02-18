# 3 for 3 — Daily Habit Tracker (PWA)

A beautiful, installable Progressive Web App for tracking 3 daily habits:
- 💪 Workout
- ⚡ Productive Day
- 📖 Bible Reading

## Features
- **Weekly tracker grid** with tap-to-toggle
- **Streak tracking** per habit
- **Stats view** with weekly / monthly / yearly completion percentages
- **Offline support** — works without internet after first load
- **Installable** — add to home screen on any device
- **Dark theme** with polished animations

---

## Quick Start (Local Dev)

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

Output goes to the `dist/` folder.

## Preview Production Build

```bash
npm run preview
```

---

## Deploy (Free Hosting)

### Option A: Vercel (Recommended — easiest)
1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **"New Project"** → import your repo
4. It auto-detects Vite — just click **Deploy**
5. Done! You get a URL like `3for3.vercel.app`

### Option B: Netlify
1. Push to GitHub
2. Go to [netlify.com](https://netlify.com) → **"Add new site"** → **"Import from Git"**
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Click **Deploy**

### Option C: GitHub Pages
1. Add to `vite.config.js`: `base: '/your-repo-name/'`
2. Run `npm run build`
3. Push the `dist/` folder to a `gh-pages` branch
4. Enable Pages in repo Settings → Pages → Source: `gh-pages`

---

## Install as App

Once deployed, visit the URL on your phone or computer:

- **iPhone/iPad**: Tap Share → "Add to Home Screen"
- **Android**: Tap the browser menu → "Install app" or "Add to Home Screen"
- **Desktop Chrome/Edge**: Click the install icon in the address bar

The app will work offline and feel native — no app store needed!

---

## Tech Stack
- React 18 + Vite
- vite-plugin-pwa (Workbox service worker)
- localStorage for data persistence
- Google Fonts (DM Sans + Playfair Display)
