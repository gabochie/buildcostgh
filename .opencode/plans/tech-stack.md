# Tech Stack — Verified

| Technology | Purpose | Status |
|---|---|---|
| Next.js 16 + App Router | Full-stack React framework | ✅ v16.2.10 |
| TypeScript | Type safety | ✅ v5 |
| Tailwind CSS + shadcn/ui | UI components (professional out of the box) | ✅ Tailwind v4 |
| Prisma | ORM | ✅ v6.19.3 |
| PostgreSQL (Neon) | Database | ⚠️ Currently SQLite — needs switch |
| NextAuth.js | Authentication (Google + email) | ✅ v5 beta |
| Zustand | Calculator multi-step state management | ✅ v5 |
| TanStack Query | Server state & caching | ✅ v5 |
| Zod | Form/API validation | ✅ v4 |
| Paystack API | Payments | ✅ Integrated |
| Resend | Transactional emails | ✅ v6 |
| Vercel | Deployment | ✅ Configured for Next.js |
| Uploadthing | File uploads (blog images, reports) | ✅ v7 |

## Database Migration

**Recommended provider:** PostgreSQL on [Neon](https://neon.tech) (serverless, free tier available)

**Changes needed:**
- `prisma/schema.prisma`: `provider = "postgresql"`
- `.env`: Update `DATABASE_URL` to Neon connection string
- Run `npx prisma migrate dev` to regenerate migrations
