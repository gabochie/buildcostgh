# Changelog — BuildCost GH

All notable changes, newest first. Dates in UTC.

## 2026-10-16 — PWA + offline-first + Web Push + hardening batch

### PWA (installable app)
- Added `src/app/manifest.ts` (`/manifest.webmanifest`): standalone display,
  `theme_color #059669`, 192/512 + maskable icons, shortcuts for
  Calculate / Costs / Estimates.
- Fixed icon references in `src/app/layout.tsx` (old `/icon.svg`, `/icon.png`,
  `/apple-icon.png` never existed) to real `public/assets/*` files; added
  `appleWebApp capable`, `viewportFit: cover`.
- New `public/sw.js` (zero-dependency): versioned caches, app-shell precache
  (`/offline`, `/calculator`, `/costs`), navigation network-first with
  `/offline` fallback, GET `/api/*` network-first + cache fallback,
  Background Sync flush for the offline estimate queue, push +
  notificationclick handlers.
- New `src/app/offline/page.tsx`, `ServiceWorkerRegister` (delayed register +
  update toast), `PwaInstallPrompt` (beforeinstallprompt, standalone-aware).
- `next.config.ts`: `worker-src`/`manifest-src 'self'` in CSP (CSP e2e spec
  untouched), `Cache-Control: no-cache` for `/sw.js`.

### Mobile bottom navigation
- New `BottomNav` (`md:hidden`, 5 tabs: Home · Costs · Calculate [raised FAB] ·
  Pros · Account, session-aware Account link, `aria-current`, 60px targets,
  safe-area padding). Rendered below `Footer`; `main` gets `pb-20 md:pb-0`.
- Chat/WhatsApp FABs and cookie banner lifted above the bar on mobile only.

### Full offline calculator
- New `src/lib/offline/estimate-offline.ts`: pure client-side estimate using
  the same `pricing-constants` as the API, so online/offline totals agree.
- New `src/lib/offline/db.ts`: IndexedDB `buildcost-offline` queue +
  Background Sync registration + flush helper.
- `Step5Result` falls back to on-device calc when `/api/calculator` is
  unreachable, shows an "Offline estimate" banner with pending count, queues
  inputs, and flushes the queue when back online. `EstimateResult.offline`
  flag added to `src/types`.

### Web Push
- New `PushSubscription` model + migration
  `20261016000000_add_push_subscriptions` (runs via `migrate deploy`).
- `web-push` + `src/lib/push.ts` (VAPID, 410/404 pruning).
- `GET /api/push/public-key`, `POST/DELETE /api/push/subscribe` (guest +
  authed, CSRF-protected), admin-only `POST /api/push/send` (broadcast/by email).
- `PushPrompt` UI (20s-delayed nudge, subscribes via `pushManager`).
- New env: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PUBLIC_KEY` /
  `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` (see `.env.example`). Generate with
  `npx web-push generate-vapid-keys`.

### PDF hardening
- Replaced `puppeteer` (full Chromium, `--no-sandbox`, OOMs serverless) with
  `puppeteer-core` + `@sparticuz/chromium` (serverless `/tmp` binary, local
  Chrome via `CHROME_PATH`), with timeouts.
- Escaped `title`/`date`/`customerName` in `buildReportHtml`
  (`report-content.ts` fields were already escaped).

### Error-surface hardening
- New `src/components/shared/error-message.tsx`: `safeErrorMessage()` never
  renders raw internals; surfaces Next `digest` as a support reference.
- Sanitized `app`, `blog`, `contact`, `costs` `error.tsx`; added missing
  `src/app/global-error.tsx`.
- `api/jobs/process` 500 no longer returns `{error, code, meta, stack}`;
  public `api/health` 503 no longer leaks Prisma/DB internals.

### Rate limiting
- New `src/lib/edge-rate-limit.ts` + wired into `src/proxy.ts`: Edge-safe
  sliding window — `/api/auth/*` + `/api/admin/*` 30/min/IP, state-changing
  `/api/*` 120/min, reads 300/min. 429s carry `Retry-After` + `X-RateLimit-*`.

### Spreadsheets
- Replaced archived `exceljs` with SheetJS `xlsx` 0.18.5 (`src/lib/excel.ts`
  rewritten, same exports/structure; round-trip verified). Trade-off: header
  fills/fonts dropped (community edition can't write styles); number formats,
  merges, widths preserved. Removes the `uuid` CVE chain.

### CI
- `ci.yml` rewritten: `checks` (prisma validate + typecheck + lint + **unit
  tests** + build), `e2e` (Playwright after checks, report on failure),
  `audit` (`npm audit --audit-level=high`, **report-only** until the
  pre-existing 36 high/critical backlog clears), Dependabot weekly security
  groups (`.github/dependabot.yml`).
- Bumped `next` + `eslint-config-next` 16.2.10 → **16.2.12** (fixes the
  middleware/proxy bypass GHSA affecting `proxy.ts`). Pinned exact, lockfile
  consistent.

### Verification (this batch)
- `tsc --noEmit` clean, `eslint` 0 errors, `npm test` 54/54 pass,
  `next build` succeeds (`/manifest.webmanifest` + `/offline` emitted).
