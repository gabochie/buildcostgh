# Changelog — BuildCost GH

All notable changes, newest first. Dates in UTC.

## 2026-10-16 — Agentic DevOps prerequisites (Phase 1, this machine)

### Health probes split
- New `GET /api/health/live` (cheap, unauthenticated, no DB — deploy-gate target)
  and `GET /api/health/ready` (DB + queue, sanitized 503). Legacy `/api/health`
  kept for existing monitors. Watchtower probes now hit `/ready`.

### Agent intake stub (`POST /api/ops/agent/intake`)
- Signed (`OPS_AGENT_KEY`, falls back to `CRON_SECRET`), zod-validated
  `{source, title, fingerprint?, url?, payload?}`. Log-only: records to
  `AgentLog` (`OpsAgent/intake_received`, 202) and takes NO action — honors
  `OPS_AGENT_ENABLED=false` kill switch. Triage runners arrive in Phase 2.

### Dependabot auto-merge (`.github/workflows/automerge.yml`)
- Patch-only + npm-only, squash, executes only when required CI checks pass.
  Minor/major stay manual. Needs "Allow auto-merge" enabled on the repo.

### Backup safety net (`scripts/backup-db.mjs`)- Pure-Node (no `pg_dump` needed): dumps business tables to `backups/<ts>/`
  as JSON + manifest (row counts, git SHA, pg version). Sensitive columns
  (`User.passwordHash`) excluded in SQL so they never leave the DB; missing
  tables recorded as `"missing"` (schema-drift tolerant).
- Verified live against the staging DB: BlogPost 44, Contractor 48,
  RegionRate 16, CalculatorLead 3 rows dumped; no `passwordHash` in output.
  Noted: this DB lacks `SavedEstimate` (behind on migrations) — flagged, not fatal.
- `/backups` gitignored. Weekly Task Scheduler job "BuildCostGH weekly backup"
  registered (Sundays 02:00 via `scripts\backup-weekly.cmd`); test-fired
  successfully (10s full dump). Restore = Neon snapshot/PITR first, JSON dumps as fallback.

### Preview smoke (`preview-smoke.yml`)
- New PR workflow: waits for the Vercel preview deployment, then probes
  `/api/health/live` + `/api/health/ready` + CSP/`worker-src` headers +
  manifest + SW. Needs repo secrets `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`,
  `VERCEL_TEAM_ID` (see manual todos).
- New `smoke-prod.yml`: same probes against production on every master push.

### 2026-10-16 — Machine-automated ops (gh + Vercel CLI/API)
- `OPS_AGENT_KEY` + VAPID keypair generated and set in Vercel Production via
  REST API (PowerShell stdin appends CRLF — caught via live `public-key`
  check showing `\r\n`, fixed byte-exact, verified clean). CLI `vercel env add`
  avoided for secrets for the same reason. Redeploy triggered via git push
  (local `vercel --prod` hits the known `.omo` trace-packaging bug).
- Repo: auto-merge + delete-branch enabled; `VERCEL_TOKEN/PROJECT_ID/TEAM_ID`
  secrets set; Preview env repaired (unscoped `DATABASE_URL` + 4 build vars —
  branch-scoped dependabot entries were shadowing nothing); CI secrets set.
- CI fixed: `env` block re-indented under job, `ADMIN_EMAIL` added, standalone
  `voice-agent/` ignored by root lint (6 pre-existing errors). CI green 5m57s.
- Preview deploys build green (`Ready`); PR #12 merged; `VERCEL_BYPASS` still
  needs dashboard copy (no API exists) for smoke probes to pass SSO.

### Verification (this batch)
- `tsc --noEmit` clean (incl. Sentry v11 + Prisma JSON fixes), `eslint` 0 errors,
  `npm test` 54/54 pass.
- Local Docker daemon unavailable, so the portability smoke still awaits its
  first container run (CI workflow on demand).

## 2026-10-16 — Anti-lock-in batch: observability, email, portability

### Vendor-neutral observability (`src/lib/observe.ts`)
- New `observe` interface (`captureError`, `setObserveContext`, `isObservabilityEnabled`).
  Sentry SDK is lazy-loaded and only when a DSN is set — no DSN = no-op, zero
  vendor code in the bundle. Errors-only (tracing + replay permanently off,
  PII never attached) so the free Developer tier (~5k/mo, no card) can't bill.
- `src/instrumentation.ts` + `src/instrumentation-client.ts` init Sentry on
  server/client only when configured. Build config untouched (no
  `withSentryConfig`) — swapping to GlitchTip/Axiom/DB-sink means editing one file.
- Adopted in: `logClientError`, `global-error.tsx`, `api/jobs/process`,
  `api/health`. New env: `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` (see `.env.example`).

### Email unification (`src/lib/email-send.ts`)
- One `sendEmail()` interface, channel order resend-sdk → resend-http → SMTP
  (Gmail, the vendor exit path), first success wins; returns `{ok, channel}`.
  `forceChannel` supports fallback drills.
- `lib/email.ts` templates, `jobs.ts` receipt + nurture, and
  `subscriptions.ts` renewal reminders all go through it (SMTP-only setups now
  deliver too; channel logged to `AgentLog`). Direct `api.resend.com` fetches removed.
- New admin-only `POST /api/admin/email-test` (`{to, channel?}`, 10/min) for
  delivery tests and drills.

### Portability exit-proof
- `Dockerfile` (multi-stage, `standalone` output only when `DOCKER_BUILD=1` —
  Vercel packaging untouched), `.dockerignore`,
  `docker-compose.portability.yml` (app + **vanilla Postgres 16**, no Neon),
  `scripts/portability-smoke.mjs` (build → migrate → poll `/api/health` +
  `/` → down; proves no Neon-only queries).
- New `portability.yml` workflow: manual + quarterly cron smoke in CI.
- Local Docker daemon unavailable in this environment — first full container
  run happens on demand via the workflow, not asserted locally.

### Verification (this batch)
- `tsc --noEmit` clean, `eslint` 0 errors, `npm test` 54/54 pass.
- Sentry v11 note: `sendDefaultPii` no longer exists (PII off by default) —
  removed from init options after typecheck caught it.

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
