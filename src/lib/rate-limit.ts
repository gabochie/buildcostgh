import { prisma } from "./prisma"

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

const ipBlocks = new Map<string, { count: number; windowStart: number }>()

export async function checkRateLimit(ip: string | null): Promise<{ allowed: boolean; remaining: number; message?: string }> {
  const key = ip || "unknown"

  // In-memory check (fast path)
  const record = ipBlocks.get(key)
  const now = Date.now()

  if (record) {
    if (now - record.windowStart > WINDOW_MS) {
      // Window expired, reset
      ipBlocks.set(key, { count: 0, windowStart: now })
    } else if (record.count >= MAX_ATTEMPTS) {
      const retryAfter = Math.ceil((WINDOW_MS - (now - record.windowStart)) / 1000 / 60)
      return { allowed: false, remaining: 0, message: `Too many attempts. Try again in ${retryAfter} minutes.` }
    }
  } else {
    ipBlocks.set(key, { count: 0, windowStart: now })
  }

  // Also check database for persistent records
  const recent = await prisma.adminLoginAttempt.findMany({
    where: {
      ip: key,
      success: false,
      createdAt: { gte: new Date(now - WINDOW_MS) },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_ATTEMPTS,
  })

  if (recent.length >= MAX_ATTEMPTS) {
    // Sync in-memory to DB state
    ipBlocks.set(key, { count: recent.length, windowStart: now - WINDOW_MS })
    const oldest = recent[recent.length - 1]
    const retryAfter = Math.ceil((WINDOW_MS - (now - oldest.createdAt.getTime())) / 1000 / 60)
    return { allowed: false, remaining: 0, message: `Too many attempts. Try again in ${retryAfter} minutes.` }
  }

  const current = ipBlocks.get(key)!
  return { allowed: true, remaining: MAX_ATTEMPTS - current.count }
}

export async function recordAttempt(ip: string | null, email: string, success: boolean): Promise<void> {
  const key = ip || "unknown"

  await prisma.adminLoginAttempt.create({
    data: { email, ip: key, success },
  })

  if (!success) {
    const record = ipBlocks.get(key)
    if (record) {
      record.count++
    } else {
      ipBlocks.set(key, { count: 1, windowStart: Date.now() })
    }
  } else {
    // Successful login resets failed attempts
    ipBlocks.delete(key)
    // Clean up old failed attempts for this IP
    await prisma.adminLoginAttempt.deleteMany({
      where: { ip: key, success: false },
    })
  }
}
