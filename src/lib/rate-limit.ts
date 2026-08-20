import { prisma } from "./prisma"

// ── Default limits ──
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const ADMIN_MAX_ATTEMPTS = 5
const PUBLIC_MAX_REQUESTS = 30
const API_MAX_REQUESTS = 60

// ── L1 in-memory cache (survives within a single serverless invocation) ──
const cache = new Map<string, { count: number; windowStart: number }>()

function getCacheEntry(key: string) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.windowStart > WINDOW_MS) {
    cache.delete(key)
    return null
  }
  return entry
}

function incrementCache(key: string): number {
  const existing = getCacheEntry(key)
  const count = (existing?.count || 0) + 1
  cache.set(key, { count, windowStart: existing?.windowStart || Date.now() })
  return count
}

function clearCache(key: string) {
  cache.delete(key)
}

// ── DB-backed rate limit check ──
export async function checkRateLimit(
  ip: string | null,
  options?: { maxAttempts?: number; windowMs?: number; useDb?: boolean; path?: string }
): Promise<{ allowed: boolean; remaining: number; message?: string }> {
  const key = (ip || "unknown") + (options?.path ? `:${options.path}` : "")
  const maxAttempts = options?.maxAttempts ?? ADMIN_MAX_ATTEMPTS
  const windowMs = options?.windowMs ?? WINDOW_MS
  const now = Date.now()

  // L1: check in-memory cache first (fast path)
  const cached = getCacheEntry(key)
  if (cached && cached.count >= maxAttempts) {
    const retryAfter = Math.ceil((windowMs - (now - cached.windowStart)) / 1000 / 60)
    return { allowed: false, remaining: 0, message: `Too many requests. Try again in ${retryAfter} minutes.` }
  }

  // L2: check DB (survives cold starts) — only if useDb is not explicitly false
  if (options?.useDb !== false) {
    try {
      const windowStart = new Date(now - windowMs)
      const recent = await prisma.rateLimitEntry.findUnique({ where: { key } })

      if (recent) {
        if (now - recent.windowStart.getTime() > windowMs) {
          // Window expired — reset
          await prisma.rateLimitEntry.update({
            where: { key },
            data: { count: 1, windowStart: new Date(now) },
          })
          cache.set(key, { count: 1, windowStart: now })
          return { allowed: true, remaining: maxAttempts - 1 }
        }

        if (recent.count >= maxAttempts) {
          const retryAfter = Math.ceil((windowMs - (now - recent.windowStart.getTime())) / 1000 / 60)
          // Sync to L1 cache
          cache.set(key, { count: recent.count, windowStart: recent.windowStart.getTime() })
          return { allowed: false, remaining: 0, message: `Too many requests. Try again in ${retryAfter} minutes.` }
        }

        // Increment DB count
        const updated = await prisma.rateLimitEntry.update({
          where: { key },
          data: { count: { increment: 1 } },
        })
        cache.set(key, { count: updated.count, windowStart: updated.windowStart.getTime() })
        return { allowed: true, remaining: maxAttempts - updated.count }
      }

      // First request — create entry
      await prisma.rateLimitEntry.create({
        data: { key, count: 1, windowStart: new Date(now) },
      })
      cache.set(key, { count: 1, windowStart: now })
      return { allowed: true, remaining: maxAttempts - 1 }
    } catch {
      // DB failure — fall through to cache-only check
    }
  }

  // Fallback: cache-only check
  const count = incrementCache(key)
  if (count >= maxAttempts) {
    const retryAfter = Math.ceil(windowMs / 1000 / 60)
    return { allowed: false, remaining: 0, message: `Too many requests. Try again in ${retryAfter} minutes.` }
  }
  return { allowed: true, remaining: maxAttempts - count }
}

// ── Legacy compatibility: record admin login attempts ──
export async function recordAttempt(ip: string | null, email: string, success: boolean): Promise<void> {
  const key = ip || "unknown"
  await prisma.adminLoginAttempt.create({
    data: { email, ip: key, success },
  })
  if (!success) {
    incrementCache(key)
  } else {
    clearCache(key)
    await prisma.adminLoginAttempt.deleteMany({ where: { ip: key, success: false } })
  }
}

// ── Factory for route-specific rate limiting ──
export function rateLimitMiddleware(options?: { maxAttempts?: number; path?: string }) {
  return async (req: Request) => {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown"
    return checkRateLimit(ip, {
      maxAttempts: options?.maxAttempts ?? PUBLIC_MAX_REQUESTS,
      path: options?.path || "global",
      useDb: true,
    })
  }
}

// ── Convenience wrappers for API routes ──
export async function apiRateLimit(
  req: Request,
  options?: { maxRequests?: number; path?: string }
): Promise<{ ok: boolean; response?: Response }> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown"

  const result = await checkRateLimit(ip, {
    maxAttempts: options?.maxRequests ?? API_MAX_REQUESTS,
    path: options?.path || "api",
    useDb: true,
  })

  if (!result.allowed) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: result.message || "Rate limit exceeded" }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(WINDOW_MS / 1000)),
          },
        }
      ),
    }
  }

  return { ok: true }
}
