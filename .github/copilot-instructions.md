<!--
  Guidance for automated code assistants working on the Sub-Track project.
  Keep this short, actionable and safe. Update this file when project structure
  or workflows change.
-->

# Sub-Track — Instructions for automated contributors / LLM agents

This repository is a small React + TypeScript progressive web app (PWA) used to
help people track substance use over time (harm reduction and mental-health
benefit). The project intentionally keeps data local to the user's browser.

When editing this project, follow these priorities:

- Safety & privacy first: do not add telemetry, analytics, or any networked
  logging of user data. The app stores logs in `localStorage` by design — keep
  that local unless the user explicitly requests export/share features.
- Make minimal, testable changes. Prefer small commits and one feature per
  change so humans can review easily.
- Preserve the user's data. Avoid migrations that risk data loss without a
  clear migration path and user-facing confirmation.

## Quick repo summary

- Build system: Vite (dev: `npm run dev`, build: `npm run build`, preview: `npm run preview`).
- Language: TypeScript + React (JSX). See `tsconfig.json`.
- Key files:
  - `index.html` — app shell (root).
  - `public/manifest.json` — PWA manifest.
  - `public/sw.js` — simple service worker (caching/core assets).
  - `src/main.tsx` — entry; mounts `App` and registers SW.
  - `src/App.tsx` — main application logic and UI (localStorage persistence).
  - `src/index.css` — app styles.

## How to run locally (Windows PowerShell)

1. Install dependencies (network required):

```powershell
npm install
```

2. Start the dev server:

```powershell
npm run dev
```

3. Build for production and preview the build:

```powershell
npm run build
npm run preview
```

Notes:

- Service worker behavior is most meaningful after `npm run build` + `npm run preview`.
- If you change `public/sw.js` or `manifest.json`, remember to update cache names or
  service worker logic to avoid stale caches.

## Developer checklist for changes

Before opening a PR or committing a change, run these checks locally and report
their status in the commit/PR description:

1. Build: `npm run build` — should complete without errors.
2. Typecheck: `npx tsc --noEmit` — no TypeScript errors.
3. Lint (if you add linters) — run them and fix issues.

If any of these fail and you cannot fix them quickly, explain why in the PR.

## Testing & verification

- There are no automated tests yet. When adding features, include at least one
  small test or a manual verification checklist in the PR description.
- For UI changes, confirm the dev server loads and that localStorage still
  contains previous entries (do not wipe data unintentionally).

## PWA and service worker notes

- The repo includes a minimal `public/sw.js`. It uses a simple cache and a
  network-first fetch strategy. For production or App Store publishing, consider
  replacing it with a more robust solution such as `vite-plugin-pwa`.
- When modifying the service worker, increase the cache name/version and add
  migration code in the `activate` event to remove old caches.

## UX & privacy guidance

- This project deals with sensitive behavioral data. Keep defaults private and
  local. If you implement export/import features, make them explicit and local
  (download JSON) or encrypted by user-supplied passphrases.
- Do not add any network endpoints for storing user logs unless the user asks
  and the code includes explicit user consent, secure transport (HTTPS), and
  privacy policy text.

## Coding style & conventions

- Small, focused changes are preferred. Keep components simple and pure where
  possible. Prefer local state and `localStorage` for this lightweight app.
- Avoid adding heavyweight dependencies. If a dependency is needed, prefer
  well-maintained, small libraries and add them explicitly to `package.json`.

## Suggested next improvements (for a human reviewer or follow-up task)

1. Add a small test harness and one or two unit tests for log persistence.
2. Add an export/import (JSON) feature with an option to encrypt exports.
3. Integrate `vite-plugin-pwa` for a production-ready PWA setup.
4. Add basic e2e or manual QA steps for checking SW registration and offline
   behavior.

## If you're an automated agent making edits

- Start by running the quick checks above. Report their results as part of the
  commit message or PR description.
- When changing storage formats, include a migration that preserves existing
  `localStorage` data or request user confirmation UI.
- Never add telemetry or remote logging without an explicit instruction from a
  human owner.

## Contact / repository owner

If unsure, open an issue in the repository and ping the maintainers. For quick
questions about intent, consult `README.md` (project goals) and the code in
`src/App.tsx`.
