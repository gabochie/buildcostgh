# BuildCost GH — Agent Session Summary

## Project Goal
Production-grade construction cost estimation platform (buildcostgh.com) with admin tools, interactive lead magnets, autonomous agents, MCP server, and human-supervised command center.

## Constraints
- PostgreSQL on Neon (serverless) free tier — sleeps after 5 min inactivity, blocks builds until woken
- GitHub repo is private (gabochie/buildcostgh)
- Admin: Credentials provider (JWT, ADMIN_PASSWORD env var) — no production ADMIN_PASSWORD set on Vercel
- No production API keys set (Paystack, Resend, UploadThing)
- Founder is Gideon B. Abochie (NOT Emmanuel G. Aboagye)
- Env uses `AUTH_SECRET` (not `NEXTAUTH_SECRET`) per NextAuth v5
- SWC WASM warnings (arch mismatch) — non-blocking, build succeeds

## Key Architectural Decisions
- ContactMessage model reused for lead magnet signups (name/email/phone already exist)
- Lead magnet PDF = HTML page + browser print-to-PDF (no server PDF gen, no email dependency)
- Static pages (`○`) have no DB dependency — deployable even when Neon sleeps
- Frankfurter API (no key) for USD/GHS exchange rates
- **Job queue**: PG-based with SKIP LOCKED pattern — zero new infra, works with Neon free tier
- **MCP server**: POST-based JSON-RPC inside Next.js (no SSE transport complexity for serverless)
- **PDF generation**: Puppeteer (server-side HTML → PDF for paid reports)
- **Env validation**: Simple required-keys check (no Zod to avoid build-time validation issues)
- **Agents**: Registered via side-effect import in ServerInit component

## What We Built

### Core Platform (existing)
- Full admin sidebar with 14 nav items (added Command Center)
- Rate limiting on admin login (5 attempts → 15 min lockout)
- Admin login via Credentials provider (ADMIN_PASSWORD)
- USD/GHS currency toggle on `/pricing`
- Various public pages (calculator, blog, flood-safe-land, CSR, pricing, etc.)
- Admin tabs: Dashboard, Orders, Messages, Leads, Newsletter, Blog, Roadmap, Ecosystem, Strategy, Prelaunch, Pitch Deck, Competitive Analysis, Settings

### Phase 0 — Infrastructure Foundation
**Database (5 new models, 1 modified):**
- `ApiKey` — API key auth for MCP/agents (keyHash, label, active, expiresAt)
- `Job` — PG-backed job queue (type, payload, status, attempts, maxAttempts, lastError, SKIP LOCKED compatible)
- `AgentLog` — Audit trail for all autonomous agent actions (agent, action, entityType, entityId, details, level)
- `SeasonalFactor` — Seasonal pricing multipliers (region, month, material, multiplier)
- `PriceUpdate` — Pricing change history (tier, oldAmount, newAmount, approved, approvedBy)
- `Order.metadata` — Fixed from `String?` to `Json?` (was causing runtime crashes)

**New API routes:**
- `GET /api/health` — DB connectivity + queue stats
- `POST /api/paystack/webhook` — Paystack webhook (HMAC-signed, charge.success → Order update + enqueue report+receipt)
- `GET /api/agent-logs` — Agent activity log viewer (admin-only, filterable)
- `POST /api/jobs/enqueue` — Enqueue background jobs
- `POST /api/jobs/retry-failed` — Retry all failed jobs
- `POST /api/jobs/clear` — Clear pending/failed jobs

**Infrastructure files:**
- `src/lib/queue.ts` — `enqueueJob()`, `processNextJob()`, `processJobQueue()`, `getQueueStats()`, `retryFailedJobs()`. Uses `SELECT ... FOR UPDATE SKIP LOCKED` for safe concurrent processing. Exponential backoff on retry.
- `src/lib/agent-log.ts` — `logAgentAction()`, `getAgentLogs()`
- `src/lib/pdf.ts` — `generatePdf()`, `buildReportHtml()`, `generateOrderReport()` using Puppeteer
- `src/lib/env.ts` — Runtime env validation (DATABASE_URL, ADMIN_PASSWORD, AUTH_SECRET)
- `src/lib/rate-limit.ts` — Generic rate limiter with in-memory + DB persistence
- `src/lib/jobs.ts` — Job handlers: `generate_report`, `send_receipt`, `nurture_lead`
- `src/lib/init.ts` — Calls `validateEnv()` + `registerAllJobHandlers()` at server start
- `src/components/ServerInit.tsx` — Server component that triggers init
- `next.config.ts` — Security headers (CSP, HSTS, X-Frame-Options, etc.)

### Phase 1 — MCP Server
**`GET/POST /api/mcp`:**
- Tool discovery: 10 tools listed with input schemas
- Tool execution: `getCostEstimate`, `createOrder`, `getOrderStatus`, `getMarketPricing`, `getSeasonalFactors`, `askAssistant`, `getLeadScore`, `listOrders`, `listBlogPosts`, `triggerReport`
- JSON-RPC response format (id, result, error)
- Auth: admin-only (via NextAuth session)
- Agents logged to AgentLog on every call

**`src/lib/mcp/tools.ts`:** Tool definitions with Zod-compatible JSON schemas
**`src/lib/mcp/server.ts`:** `executeTool()` — implements all 10 business tools

### Phase 2 — Autonomous Agents
- **PaymentBot**: Webhook handler (Paystack charge.success) → Order status update → enqueue PDF generation + receipt email. HMAC signature verification.
- **ReportBot**: `generate_report` job handler → Puppeteer HTML-to-PDF → saves to `/public/reports/` → sets `reportUrl` on Order
- **LeadBot**: Lead capture (calculator, lead magnet, contact form) → lead scoring → nurture email sequence via Resend
- **PriceBot**: Seasonal factor integration + market data monitoring (tools available via MCP)
- **SupportBot**: AI-powered FAQ via MCP `askAssistant` tool (10+ hardcoded FAQs with cost, timeline, diaspora, permit info)

### Phase 3 — Command Center
**14th admin tab: "Command Center"** with 5 sub-tabs:
1. **Executive Dashboard** — KPI cards (pending/processing/completed/failed jobs), System Status grid, Recent Activity feed (auto-refresh every 15s)
2. **Activity Feed** — Real-time scrollable log of all agent actions, color-coded (error/warning/success/info), filters by agent/level
3. **Job Queue** — Queue stats, Process Queue button, Retry Failed button
4. **Agent Controls** — Pause/Resume all agents, Clear all jobs, 6 agent status cards (PaymentBot, ReportBot, LeadBot, PriceBot, SupportBot, MCP Server)
5. **Business Rules** — Sliders for thresholds (max auto price change %, lead score HITL, max unattended order value GHS, auto refund max GHS), Alert configuration checkboxes

### Phase 4 — Seasonality Engine
- `SeasonalFactor` model in DB (region, month, material, multiplier, reason)
- MCP tool `getSeasonalFactors()` returns current month's factors with season description (peak/off-peak)
- Peak season (Nov-Mar dry season): higher demand, premium pricing
- Off-peak (Apr-Oct rainy season): potential discounts, better contractor availability
- Framework ready for PriceBot to auto-adjust monthly

### Conversion Optimization (earlier session)
- ExitIntentPopup, blog article CTA, pricing urgency banner

## Deployments
- Cloudflare: CNAME `@` → `cname.vercel-dns.com` with proxy on
- Vercel: `gabochie-8577s-projects` / `buildcostgh.com`
- Neon DB: `ep-broad-field-ah95iz15.c-3.us-east-1.aws.neon.tech`

## Pending / Blocked
1. **Neon DB sleeping** — blocks `prisma migrate deploy`. Migration SQL exists in `prisma/migrations/20260709082655_autonomous_system/migration.sql` — needs to be applied when DB is awake
2. **Production API keys** — Paystack, Resend, UploadThing not set. PaymentBot webhook + receipt email won't work without them
3. **No OpenAI key set** — SupportBot uses hardcoded FAQ (no LLM)
4. **SSE MCP transport** — Current MCP is POST-based only. Full SSE streaming requires Node.js raw response access (needs custom transport for Next.js)
5. **Puppeteer in Vercel** — Requires large layer/chromium. May need `@sparticuz/chromium` for serverless
6. **7 npm vulnerabilities** (3 moderate, 4 high) unfixed
