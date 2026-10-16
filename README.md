# BuildCost GH

Construction cost estimating platform for Ghana. Estimate the cost to build a house, commercial property, or industrial facility in Ghana — with elemental breakdowns, building-type catalogs, professional fees, permit requirements, and downloadable PDF/XLSX reports.

Built with **Next.js 16 (App Router)**, **Prisma + PostgreSQL**, **NextAuth v5 (JWT)**, **Tailwind CSS v4**, **Zustand**, and **TanStack Query**.

## Features

- **Cost estimator** — 8-step calculator with elemental cost breakdown, professional fees, permit intelligence, and FX-aware currency output.
- **Building types** — catalog of residential / commercial / industrial categories with subtypes and indicative cost ranges.
- **Reports** — PDF and XLSX reports delivered under a signed, time-limited download URL (protected by report-access tokens).
- **Payments** — MTN Mobile Money (USSD push), Moolre, ExpressPay (accepts Mobile Money, Ghana Pay, and cards), Paystack cards, and crypto via Coinbase Commerce (USDC, USDT, ETH, BTC and 100+ coins). A customer-facing gateway selector lets users pick at checkout, and callbacks/redirects are always re-verified server-side against the provider (never trusted from the raw body).
- **Subscription plans** — one-time report purchases plus optional subscription plans with a nightly expiry/renewal maintenance cron.
- **Public V1 API** — estimate, building-types, locations, cost-rates, and permit-requirements endpoints with API-key quotas and per-key rate limiting (`Retry-After`).
- **Admin dashboard** — content management, orders, API keys, queue inspection.
- **Content scheduler** — an adjustable 1-year content plan (`content/content-plan.json`: pillars, topics, cadence, offers) consumed by a cron-driven AI engine that fills upcoming slots and cross-posts approved drafts (Facebook, LinkedIn, X). All drafts require founder approval.
- **i18n** — English and Twi (`en` / `tw`).

## Getting started

Requirements: Node 20+, PostgreSQL.

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Copy `.env.example` to `.env.local` and fill in your values.

```bash
copy .env.example .env.local
```

At minimum you need `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `NEXT_PUBLIC_APP_URL` — the app refuses to boot in production without them.

Generate secrets:

```bash
openssl rand -base64 32   # AUTH_SECRET, CRON_SECRET
```

## Useful commands

| Command                 | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `npm run dev`           | Start the dev server                           |
| `npm run build`         | Migrate DB, then production build              |
| `npm run typecheck`     | TypeScript type checking (`tsc --noEmit`)      |
| `npm run lint`          | ESLint                                         |
| `npm test`              | Run unit tests (`tsx --test`)                  |
| `npm run db:migrate`    | Apply Prisma migrations                        |
| `npm run db:seed`       | Seed the database                              |
| `npm run db:studio`     | Open Prisma Studio                             |

## Deployment (Vercel)

Set the environment variables documented in `.env.example`. Scheduled jobs run via `vercel.json` crons:

- `/api/jobs/process` — daily queue + subscription expiry/renewal maintenance (3:00 AM).
- `/api/content/scheduled` — content generation scheduler (Sundays 3:30 AM). Reads the 1-year plan from `content/content-plan.json` and batch-fills up to `CONTENT_PLAN_DRAFTS_PER_RUN` pending slots (default 5) using a multi-post LLM call (`CONTENT_PLAN_BATCH_SIZE` slots per call, default 3). Blog-type slots also get a `published:false` BlogPost draft ready for the blog editor. Falls back to the legacy cadence engine if the plan file is absent. Drafts are never auto-published.

Both are protected by the `CRON_SECRET` bearer token. Env guards:

- Generation: `CONTENT_CRON_ENABLED=true` + an LLM key (`OPENAI_API_KEY`, or `GROQ_API_KEY`/`CEREBRAS_API_KEY` — providers fall back in that order).
- Social images: `CONTENT_GENERATE_IMAGES=enabled` (default: on automatically when Facebook/Instagram/TikTok credentials exist; `disabled` turns it off). Rendered to `/content-images/*`.
- Auto-publish: Facebook (`FACEBOOK_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID`), X (`X_BEARER_TOKEN`), LinkedIn (`LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_URN`), Instagram (`FACEBOOK_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID` — needs an image on the draft; TikTok stays manual).
- Batch publish: `POST /api/content/publish` publishes every approved draft in one call (or pass `{ "draftIds": [...] }`); the admin Content Marketing tab has a "Publish all approved" button.
- AdSense: the verification meta (`ca-pub-1299715274212521`) is set in the root layout. Set `NEXT_PUBLIC_ADSENSE_CLIENT` (public) plus `NEXT_PUBLIC_ADSENSE_AD_SLOT_BLOG` (public) to enable a responsive banner on blog article pages; without a client/slot it renders a dashed placeholder.

### Autonomous Ops Watchtower

Hobby/Pro plans do not run `vercel.json` crons, so scheduled work is executed by the GitHub Actions workflow `.github/workflows/crons.yml` hitting the production URL with `Authorization: Bearer $CRON_SECRET`:

| Schedule (UTC)    | Endpoint                                        | What it does |
| ----------------- | ----------------------------------------------- | ------------ |
| Daily 03:05       | `GET /api/jobs/process`                         | Drain job queue + subscription expiry/renewal |
| Weekly Sun 03:30  | `GET /api/content/scheduled`                    | Content Marketing agent (batch-fills plan slots) |
| Daily 06:10       | `GET /api/ops/watchtower`                       | Autonomous ops agent (below) |

The watchtower (`src/lib/ops.ts`, also runnable via the admin **Ops Watchtower** tab → "Run check now") autonomously:

- **Probes** the database and the key public pages (`/`, `/blog`, `/calculator`, `/pricing`, `/api/health`).
- **Collects** 24h business metrics (orders/revenue/leads/subscribers, queue, drafts, social backlog, agent-log errors/warnings).
- **Self-repairs** inside the app only, never touching deploys/publishing/payments: requeues stuck `processing` jobs, drains the queue, requeues failed jobs with transient errors, and backfills overdue content-plan slots (12h cooldown).
- **Summarizes** the run with the Ops subagent (GROQ/OpenAI) and logs every run to `AgentLog` (`agent="OpsWatchtower"`).

Tunables (safe defaults on): `OPS_AUTO_RETRY_STUCK`, `OPS_STUCK_JOB_MS`, `OPS_AUTO_DRAIN`, `OPS_DRAIN_MAX`, `OPS_AUTO_RETRY_TRANSIENT`, `OPS_AUTO_CONTENT`, `OPS_SUMMARY`, `OPS_PROBE_TIMEOUT_MS`. Github repo secrets needed: `CRON_SECRET` (required) and `PROD_URL` (optional, defaults to `https://buildcostgh.com`). `vercel.json` crons are kept as a fallback for plans that do support them — every endpoint is idempotent (SKIP LOCKED queue, deduped plan slots), so double-firing is harmless.

## Project layout

```
├── content/                  # 1-year content plan JSON (edited here; mirrored to Desktop)
├── prisma/                  # schema + migrations + seed
├── public/                  # static assets (reports are NOT stored here); /content-images holds AI social graphics
├── reports-storage/         # generated PDF/XLSX (gitignored, outside public/)
└── src/
    ├── app/                 # App Router pages + API routes
    ├── components/          # UI + calculator components
    ├── lib/                 # engines, auth, queues, payments, content planner + batch/output/media, i18n
    └── store/               # Zustand client state
```

## Security notes

- Reports are served only through `/api/reports/download` after validating an HMAC token and / or session ownership; static report URLs are not exposed.
- CSRF and payment secrets have no hardcoded fallbacks — misconfiguration fails loudly in production.
- V1 API keys are consumed atomically and rate-limited to prevent quota-bypass.

## Live Demo ✅ Verified Oct 16 2026
Live: https://buildcostgh.com — estimator + PDF/XLSX, MTN MoMo + cards.

## Case Study — Quote in minutes, not days
Problem: guesswork quotes lose jobs. Build: Next16 + Prisma + PDF/XLSX + crons. Result: contractor sends pro quote same day. Service: $1,500 MVP in 14 days.
