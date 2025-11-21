<!--
  Guidance for automated contributors and human reviewers working on Sub-Track.
  Keep this short, actionable and safe. Update when repository structure
  or workflows change.
-->

# Sub-Track — Instructions for automated contributors / LLM agents

Short, focused guidance to help automated agents or reviewers contribute safely
and predictably to this small React + TypeScript progressive web app (PWA).

Principles

- Safety & privacy first: do not add telemetry, analytics, or any networked
  logging of user data. The app intentionally stores logs in `localStorage` —
  keep data local unless the user explicitly requests export/share features.
- Small, testable changes: prefer small commits and one feature per change.
- Preserve user data: avoid destructive migrations without a migration plan and
  user-facing confirmation.

Quick repo summary

- Build system: Vite (dev: `npm run dev`, build: `npm run build`, preview: `npm run preview`).
- Language: TypeScript + React (JSX). See `tsconfig.json`.
- Key files:
  - `index.html` — app shell
  - `public/manifest.json` — PWA manifest
  - `public/sw.js` — simple service worker (caching/core assets)
  - `src/main.tsx` — entry; mounts `App` and registers SW
  - `src/App.tsx` — main application logic and UI (localStorage persistence)
  - `src/index.css` — app styles

Run & build (Windows PowerShell)

1. Install dependencies:

```powershell
npm install
```

2. Start dev server:

```powershell
npm run dev
```

3. Build and preview production bundle:

```powershell
npm run build
npm run preview
```

Notes

- Service worker behavior is most meaningful after `npm run build` + `npm run preview`.
- If you change `public/sw.js` or `manifest.json`, update cache names and add
  migration logic in `activate` to clear or rename old caches.

Developer checklist (run before opening a PR)

1. Build: `npm run build` — should complete without errors.
2. Typecheck: `npx tsc --noEmit` — no TypeScript errors.
3. Dev verification: `npm run dev` and confirm app loads in the browser.

If you add linting or tests, include how to run them here and mark their status.

Testing & verification

- There are currently no automated tests. When adding features, include at
  least one small test or a manual verification checklist that covers persistence
  and a representative UI flow.
- For UI changes, verify the dev server loads and existing `localStorage`
  entries are preserved (do not wipe data unintentionally).

PWA & service worker

- The included `public/sw.js` is intentionally minimal. For production-grade
  PWA functionality consider `vite-plugin-pwa`.
- When changing the SW, bump cache name/version and remove stale caches in
  the `activate` event.

UX & privacy guidance

- This project deals with sensitive behavioral data. Keep defaults private and
  local. Export/import should be explicit (download JSON) or encrypted by a
  user-supplied passphrase.
- Never add remote storage or analytics without explicit human approval,
  a privacy policy, and user consent.

Coding style & dependencies

- Keep changes small and focused. Prefer pure components and local state.
- Avoid adding large dependencies. If required, pick well-maintained, small
  libraries and update `package.json` accordingly.

Suggested improvements (for human reviewers)

1. Add a small test harness and unit tests for log persistence.
2. Implement export/import (JSON) with optional encryption.
3. Consider `vite-plugin-pwa` for improved offline behaviour.

If you're an automated agent making edits

- Run the quick checks above and include their status in the commit/PR.
- When changing storage formats, include a migration that preserves existing
  `localStorage` data or present a user confirmation UI.
- Do not add telemetry or remote logging unless explicitly instructed by a
  repository owner.

Contact / repository owner

Open an issue and ping the maintainers for intent questions. For quick
references consult `README.md` and `src/App.tsx`.
