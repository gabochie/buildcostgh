import { prisma } from "./prisma"

const WINDOW_MS = 15 * 60 * 1000
const ADMIN_MAX_ATTEMPTS = 5
const PUBLIC_MAX_REQUESTS = 30

const ipBlocks = new Map<string, { count: number; windowStart: number }>()

export async function checkRateLimit(
  ip: string | null,
  options?: { maxAttempts?: number; windowMs?: number; useDb?: boolean }
): Promise<{ allowed: boolean; remaining: number; message?: string }> {
  const key = ip || "unknown"
  const maxAttempts = options?.maxAttempts ?? ADMIN_MAX_ATTEMPTS
  const windowMs = options?.windowMs ?? WINDOW_MS
  const now = Date.now()

  const record = ipBlocks.get(key)
  if (record) {
    if (now - record.windowStart > windowMs) {
      ipBlocks.set(key, { count: 0, windowStart: now })
    } else if (record.count >= maxAttempts) {
      const retryAfter = Math.ceil((windowMs - (now - record.windowStart)) / 1000 / 60)
      return { allowed: false, remaining: 0, message: `Too many requests. Try again in ${retryAfter} minutes.` }
    }
  } else {
    ipBlocks.set(key, { count: 0, windowStart: now })
  }

  if (options?.useDb !== false) {
    const recent = await prisma.adminLoginAttempt.findMany({
      where: {
        ip: key,
        success: false,
        createdAt: { gte: new Date(now - windowMs) },
      },
      orderBy: { createdAt: "desc" },
      take: maxAttempts,
    })
    if (recent.length >= maxAttempts) {
      ipBlocks.set(key, { count: recent.length, windowStart: now - windowMs })
      const oldest = recent[recent.length - 1]
      const retryAfter = Math.ceil((windowMs - (now - oldest.createdAt.getTime())) / 1000 / 60)
      return { allowed: false, remaining: 0, message: `Too many requests. Try again in ${retryAfter} minutes.` }
    }
  }

  const current = ipBlocks.get(key)!
  return { allowed: true, remaining: maxAttempts - current.count }
}

export async function recordAttempt(ip: string | null, email: string, success: boolean): Promise<void> {
  const key = ip || "unknown"
  await prisma.adminLoginAttempt.create({
    data: { email, ip: key, success },
  })
  if (!success) {
    const record = ipBlocks.get(key)
    if (record) record.count++
    else ipBlocks.set(key, { count: 1, windowStart: Date.now() })
  } else {
    ipBlocks.delete(key)
    await prisma.adminLoginAttempt.deleteMany({ where: { ip: key, success: false } })
  }
}

export function rateLimitMiddleware(options?: { maxAttempts?: number }) {
  return async (req: Request) => {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    return checkRateLimit(ip, { maxAttempts: options?.maxAttempts ?? PUBLIC_MAX_REQUESTS, useDb: false })
  }
}
