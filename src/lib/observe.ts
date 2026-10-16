// Vendor-neutral error observability.
//
// All app code reports errors through here — never by importing Sentry
// directly. The Sentry SDK is lazy-loaded and only when a DSN is configured
// (`SENTRY_DSN` server / `NEXT_PUBLIC_SENTRY_DSN` client), so:
//   - with no DSN: every call is a no-op (zero cost, zero vendor code in bundle)
//   - to switch vendors (GlitchTip, Axiom, ...): change this file only
//
// Tracing + Session Replay are permanently off — errors-only keeps the free
// tier (~5k/mo, no card on file) unbustable.

export interface ObserveContext {
  scope?: string
  extra?: Record<string, unknown>
}

function dsn(): string | null {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_SENTRY_DSN || null
  }
  return process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || null
}

export function isObservabilityEnabled(): boolean {
  return Boolean(dsn())
}

async function backend() {
  if (!isObservabilityEnabled()) return null
  try {
    return await import("@sentry/nextjs")
  } catch {
    return null
  }
}

/** Report an error. Fire-and-forget safe — never throws, never blocks. */
export async function captureError(err: unknown, context?: ObserveContext): Promise<void> {
  const Sentry = await backend()
  if (!Sentry) return
  try {
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), {
      tags: context?.scope ? { scope: context.scope } : undefined,
      extra: context?.extra,
    })
  } catch {
    // Observability must never break the app.
  }
}

/** Attach low-cardinality context (user id, route). PII never sent by default. */
export async function setObserveContext(context: Record<string, unknown>): Promise<void> {
  const Sentry = await backend()
  if (!Sentry) return
  try {
    Sentry.setContext("app", context)
  } catch {
    // no-op
  }
}
