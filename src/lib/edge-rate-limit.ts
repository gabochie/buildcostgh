// Edge-safe global rate limiter for `src/proxy.ts` (middleware runtime).
// No Node.js APIs, no Prisma — a sliding-window counter in module memory.
// This is a first line of defense only (per-instance memory, best-effort
// across regions); DB-backed per-route limits in `src/lib/rate-limit.ts`
// remain the source of truth for sensitive endpoints.

const WINDOW_MS = 60_000 // 1 minute sliding window

interface Bucket {
  hits: number[]
}

const buckets = new Map<string, Bucket>()

// Prune occasionally so the map can't grow unbounded in long-lived runtimes.
let opsSincePrune = 0

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    while (bucket.hits.length > 0 && now - bucket.hits[0] > WINDOW_MS) {
      bucket.hits.shift()
    }
    if (bucket.hits.length === 0) buckets.delete(key)
  }
  if (buckets.size > 10_000) buckets.clear()
  opsSincePrune = 0
}

export interface EdgeLimit {
  limit: number
  remaining: number
  retryAfterSec: number
}

export function checkEdgeRateLimit(ip: string, scope: string, limit: number): { allowed: boolean; info: EdgeLimit } {
  const now = Date.now()
  const key = `${scope}:${ip}`
  let bucket = buckets.get(key)
  if (!bucket) {
    bucket = { hits: [] }
    buckets.set(key, bucket)
  }
  while (bucket.hits.length > 0 && now - bucket.hits[0] > WINDOW_MS) {
    bucket.hits.shift()
  }
  if (bucket.hits.length >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((WINDOW_MS - (now - bucket.hits[0])) / 1000))
    if (++opsSincePrune > 500) prune(now)
    return { allowed: false, info: { limit, remaining: 0, retryAfterSec } }
  }
  bucket.hits.push(now)
  if (++opsSincePrune > 500) prune(now)
  return { allowed: true, info: { limit, remaining: limit - bucket.hits.length, retryAfterSec: 0 } }
}

// Scope + budget per API area. Auth/admin stay strict; general API generous
// enough to never trip legitimate use (per-route DB limits still apply).
export function edgeLimitFor(pathname: string, method: string): { scope: string; limit: number } | null {
  if (!pathname.startsWith("/api/")) return null
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/admin")) {
    return { scope: "api:auth", limit: 30 }
  }
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    return { scope: "api:write", limit: 120 }
  }
  return { scope: "api:read", limit: 300 }
}

export function clientIpFromHeaders(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  )
}
