# Tech Stack — Verified (July 2026)

| Technology | Purpose | Status |
|---|---|---|
| Next.js 16 + App Router | Full-stack React framework | ✅ v16.2.10 |
| TypeScript | Type safety | ✅ v5 |
| Tailwind CSS v4 + shadcn/ui | UI components | ✅ |
| Prisma | ORM | ✅ v6.19.3 |
| PostgreSQL (Neon) | Database | ✅ Production |
| NextAuth.js v5 | Authentication (Credentials provider) | ✅ JWT strategy |
| Zustand | Calculator multi-step state management | ✅ v5 |
| TanStack Query | Server state & caching | ✅ v5 |
| Paystack API | Payments | ✅ Integrated (keys not set) |
| Resend | Transactional emails | ✅ v6 (key not set) |
| Vercel | Deployment | ✅ Production |
| Uploadthing | File uploads (blog images, reports) | ✅ v7 (keys not set) |
| Cloudflare | CDN + DNS | ✅ Proxied |
| Framer Motion | Animations | ✅ v12 |

## Infrastructure
- **Hosting:** Vercel (serverless)
- **Database:** Neon (PostgreSQL, serverless, free tier)
- **CDN:** Cloudflare (proxied CNAME to vercel-dns.com)
- **Domain:** buildcostgh.com

## Security (Implemented)
- Admin login rate limiting (5 attempts / 15 min lockout per IP)
- Failed login tracking in database (AdminLoginAttempt model)
- Maintenance mode with admin toggle
- Proxy middleware for auth protection (/dashboard)

## Known Gaps (see Roadmap)
- No API input validation (Zod)
- No error tracking (Sentry)
- No security headers (CSP, HSTS)
- No Paystack webhook
- No PDF report generation after payment
- Several production API keys not set
