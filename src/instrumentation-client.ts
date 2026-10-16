// Next.js client instrumentation — initializes error observability in the
// browser. No-op unless NEXT_PUBLIC_SENTRY_DSN is set.

import * as Sentry from "@sentry/nextjs"

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    // No PII: v11 SDKs don't attach user/request PII unless explicitly set.
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
