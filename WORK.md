# BuildCostGH Deployment Notes

## Status (as of 2026-10-16): PWA + HARDENING BATCH — DEPLOYED LIVE
- Commits `24efc0c` (feat) + `bd62d2d` (docs) pushed to `origin/master`; Vercel auto-deployed.
- Live-verified: `/manifest.webmanifest` 200 (standalone, maskable icons, shortcuts), `/sw.js` serving, `/offline` renders with bottom nav, homepage 200 through new proxy (Edge rate limits active).
- Push migration `20261016000000_add_push_subscriptions` applied via `migrate deploy` in the Vercel build (deploy green = migration clean).
- Still open: set VAPID keys in Vercel Production to activate Web Push (code no-ops safely until then).
- PWA shippable: manifest, zero-dep service worker, `/offline`, install prompt, bottom nav, full offline calculator (IndexedDB queue + sync), Web Push (needs VAPID keys in Vercel — see `.env.example`).
- Hardening: global Edge rate limits in `proxy.ts`, sanitized error boundaries + `global-error.tsx`, no-stack 5xx, `puppeteer` → `puppeteer-core + @sparticuz/chromium`, `exceljs` → `xlsx`, CI gates (unit + e2e + audit report-only + Dependabot), Next 16.2.10 → **16.2.12** (middleware-bypass GHSA fix — was NOT cosmetic).
- Verified: `tsc` clean, `eslint` 0 errors, unit 54/54, `next build` green.
- Before deploy: set VAPID keys in Vercel Production; migration `20261016000000_add_push_subscriptions` runs via `migrate deploy` in build.
- Prior live state (2026-09-09) below — unchanged.

## Status (as of 2026-09-09): DEPLOYED — LIVE
- `https://buildcostgh.com` is READY (production) and serves current `master` = `febcd52` (committed 2026-09-08T04:07:41Z, deployed seconds later).
- All major routes return 200 with real content: `/`, `/calculator`, `/blog`, `/about`, `/admin`, `/login`, `/api/health`.
- Production DB (`.env.production.local`: `...@ep-broad-field-ah95iz15.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require`) reachable, 21 migrations applied, none pending.

## The blocker that is now fixed
- Every prior production deploy was ERROR; the site had never gone live.
- Root cause (deterministic, reproduced locally AND on clean remote builds): Next 16.2.10 webpack emitted `.nft.json` traces whose `files` lists include paths Next itself never writes. Vercel's builder lstats every traced file while packaging lambdas → `ENOENT lstat /vercel/path0/.next/export-detail.json`, then `.../.next/server/proxy.js` + `.../proxy.js.nft.json`.
  - `export-detail.json` is deleted by Next at end of build (`next/dist/build/index.js:2498`, guarded).
  - `proxy.js` / `proxy.js.nft.json` reference the new "proxy" middleware naming that webpack tracing records but never emits (only `middleware.js*` is written).
- Fix:
  - `package.json` → `"vercel-build": "npm run build && node scripts/ensure-export-detail.mjs"` (Vercel prefers `vercel-build` over `build`).
  - `scripts/ensure-export-detail.mjs` writes a `.{next}/export-detail.json` stub `{version:99,success:false,outDirectory:''}` (unknown version → guarded `getExportStatus` returns false, behavior unchanged), then generically creates any OTHER missing trace-referenced file scoped inside `.next` (empty for `.js`, `{}` for `.nft.json`). Verified: exactly 2 real missing refs remain aside from export-detail.
- Note: local `vercel build` (old CLI v50 / `@vercel/next@4.16.2`) still fails at `Unable to find lambda for route: /admin/blog/new` — LOCAL-ONLY artifact of the legacy WASM/swc fallback grouping path; remote uses the newer adapter-based packaging and passes. Git push is the authoritative deploy path; CLI `--prod` uploads carry local `.omo`/`.codegraph` trace pollution.

## Prior context kept
- Objective: deploy BuildCostGH live (done), then real payments (all gateways still SANDBOX — user must set live Paystack/MoMo/ExpressPay keys in Vercel Production and redeploy before taking real money).
- `ADMIN_EMAIL=buildcostgh@gmail.com` set locally + Vercel Production (older deploys failed on `nextjs_docs`/ADMIN_EMAIL).
- `next.config.ts` keeps `outputFileTracingRoot: import.meta.dirname` + CSP headers (pushed as `a5675d3`).
- E2E 16/16 green (workers 1 / fullyParallel false); typecheck clean; unit 15/15; eslint 0 errors/91 warnings.
- Environment: Next 16.2.10 pinned exact (16.2.12 is latest 16.2.x), Prisma 6.19.3, Node 22.23.2, Windows PowerShell. Project: `C:\Users\user\Documents\GitHub\buildcostgh`; Vercel project `gabochie-8577s-projects/buildcostgh` (projectId `prj_XdDUZe4RRgnMRQR2cygJ0fgXVXzp`); origin `git@...:gabochie/buildcostgh.git` (`master`).
- Dev `.env` DATABASE_URL points at sleeping pooler `ep-quiet-heart-ahptdyt1-pooler...` (P1001); local builds workaround = inline-env override to the production URL.
- Vercel CLI: shim `vercel.ps1`; real entry `C:\Users\user\AppData\Roaming\npm\node_modules\vercel\dist\vc.js`; API token `C:\Users\user\AppData\Roaming\com.vercel.cli\Data\auth.json`.

## Next soft steps
1. Real payments: user sets live Paystack (MOMO) / MTN MoMo / ExpressPay keys in Vercel Production → redeploy → smoke-test deposit + withdrawal flows per gateway.
2. (Optional) Confirm dev/tier of the READY deploy costs; clean up old ERROR deploys.
3. (Optional) Consider bumping Next 16.2.10 → 16.2.12 eventually; cosmetic only.
   → DONE 2026-10-16 (and it was a security fix: middleware/proxy bypass GHSA, not cosmetic).