import crypto from "crypto"
import { prisma } from "./prisma"
import { checkRateLimit } from "./rate-limit"
import { NextResponse } from "next/server"

const sha256 = (input: string) => crypto.createHash("sha256").update(input).digest("hex")

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ""

export type SessionUser = {
  id?: string | null
  name?: string | null
  email?: string | null
  role?: string | null
} | undefined

/**
 * The environment-variable admin account is always treated as a super-admin
 * (the bootstrap account). Database-backed admins are promoted by setting the
 * User.role to "admin" or "super_admin".
 */
export function isSuperAdmin(user: SessionUser): boolean {
  return !!user?.email && user.email === ADMIN_EMAIL || user?.role === "super_admin"
}

export function isAdmin(user: SessionUser): boolean {
  if (isSuperAdmin(user)) return true
  return user?.role === "admin"
}

export type ApiAuthResult = { ok: true; key: { id: string; tier: string; label: string }; retryAfter?: number } | { ok: false; error: string; status: number; retryAfter?: number }

/**
 * Build an error Response for a failed API-key authentication, surfacing the
 * Retry-After header when present so clients know when to back off (429s).
 */
export function apiKeyErrorResponse(result: Extract<ApiAuthResult, { ok: false }>): NextResponse {
  return NextResponse.json(
    { error: result.error },
    { status: result.status, headers: result.retryAfter ? { "Retry-After": String(result.retryAfter) } : undefined }
  )
}

export async function authenticateApiKey(req: Request): Promise<ApiAuthResult> {
  const authHeader = req.headers.get("authorization") || ""
  const apiKey = authHeader.replace(/^Bearer\s+/i, "").trim()

  if (!apiKey) {
    return { ok: false, error: "API key required. Provide via Authorization: Bearer <key>", status: 401 }
  }

  const keyHash = sha256(apiKey)
  const record = await prisma.apiKey.findUnique({ where: { keyHash } })

  if (!record) {
    return { ok: false, error: "Invalid API key", status: 401 }
  }

  if (!record.active) {
    return { ok: false, error: "API key is inactive", status: 403 }
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    return { ok: false, error: "API key has expired", status: 403 }
  }

  // Short-window request throttle (distinct from the monthly quota) so a single
  // key can't hammer the API. Keyed by the stored key id to survive cold starts.
  const throttle = await checkRateLimit(`apikey:${record.id}`, {
    maxAttempts: 60,
    windowMs: 15 * 60 * 1000,
    path: "v1",
    useDb: true,
  })
  if (!throttle.allowed) {
    return {
      ok: false,
      error: throttle.message || "Too many requests. Please slow down.",
      status: 429,
      retryAfter: Math.ceil((15 * 60 * 1000) / 1000),
    }
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Atomically reset the monthly counter when the key crosses into a new month
  // (or has never been reset). updateMany matches AND updates in one statement
  // guarded by the lastResetAt condition, so concurrent callers can't both
  // reset and lose increments.
  if (record.lastResetAt < monthStart || !record.lastResetAt) {
    await prisma.apiKey.updateMany({
      where: { id: record.id, lastResetAt: { lt: monthStart } },
      data: { usageCount: 0, lastResetAt: now },
    })
  }

  // Atomically consume quota: only increment the counter when it is still
  // below the monthly limit. count===1 in the result means the increment
  // succeeded; count===0 means the limit is already reached.
  const consumed = await prisma.apiKey.updateMany({
    where: { id: record.id, usageCount: { lt: record.monthlyLimit } },
    data: { usageCount: { increment: 1 }, lastUsedAt: now },
  })

  if (consumed.count === 0) {
    return { ok: false, error: `Monthly usage limit (${record.monthlyLimit}) exceeded. Upgrade your tier at /api-pricing`, status: 429 }
  }

  return { ok: true, key: { id: record.id, tier: record.tier, label: record.label } }
}