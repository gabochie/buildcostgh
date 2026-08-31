# BuildCost GH

Construction cost estimating platform for Ghana. Estimate the cost to build a house, commercial property, or industrial facility in Ghana — with elemental breakdowns, building-type catalogs, professional fees, permit requirements, and downloadable PDF/XLSX reports.

Built with **Next.js 16 (App Router)**, **Prisma + PostgreSQL**, **NextAuth v5 (JWT)**, **Tailwind CSS v4**, **Zustand**, and **TanStack Query**.

## Features

- **Cost estimator** — 8-step calculator with elemental cost breakdown, professional fees, permit intelligence, and FX-aware currency output.
- **Building types** — catalog of residential / commercial / industrial categories with subtypes and indicative cost ranges.
- **Reports** — PDF and XLSX reports delivered under a signed, time-limited download URL (protected by report-access tokens).
- **Payments** — MTN Mobile Money (MoMo), Paystack, and ExpressPay. MoMo callbacks are verified server-side against the MTN API (`getPaymentStatus`), not trusted from the raw request body.
- **Subscription plans** — one-time report purchases plus optional subscription plans with a nightly expiry/renewal maintenance cron.
- **Public V1 API** — estimate, building-types, locations, cost-rates, and permit-requirements endpoints with API-key quotas and per-key rate limiting (`Retry-After`).
- **Admin dashboard** — content management, orders, API keys, queue inspection.
- **Content scheduler** — cron-driven AI content generation and cross-posting (Facebook, LinkedIn, X).
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
- `/api/content/scheduled` — content generation scheduler (3:30 AM).

Both are protected by the `CRON_SECRET` bearer token.

## Project layout

```
├── prisma/                  # schema + migrations + seed
├── public/                  # static assets (reports are NOT stored here)
├── reports-storage/         # generated PDF/XLSX (gitignored, outside public/)
└── src/
    ├── app/                 # App Router pages + API routes
    ├── components/          # UI + calculator components
    ├── lib/                 # engines, auth, queues, payments, i18n
    └── store/               # Zustand client state
```

## Security notes

- Reports are served only through `/api/reports/download` after validating an HMAC token and / or session ownership; static report URLs are not exposed.
- CSRF and payment secrets have no hardcoded fallbacks — misconfiguration fails loudly in production.
- V1 API keys are consumed atomically and rate-limited to prevent quota-bypass.
