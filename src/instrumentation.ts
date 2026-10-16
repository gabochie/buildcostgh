// Next.js server instrumentation — initializes error observability.
// No-op unless SENTRY_DSN is set (see src/lib/observe.ts).

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return

  const Sentry = await import("@sentry/nextjs")
  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    // Errors-only: tracing + replay permanently off (free-tier safety).
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    // No PII: v11 SDKs don't attach user/request PII unless explicitly set.
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
  })
}
