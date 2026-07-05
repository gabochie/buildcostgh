import crypto from "crypto"
import { prisma } from "./prisma"

const sha256 = (input: string) => crypto.createHash("sha256").update(input).digest("hex")

export type ApiAuthResult = { ok: true; key: { id: string; tier: string; label: string } } | { ok: false; error: string; status: number }

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

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  if (record.lastResetAt < monthStart) {
    await prisma.apiKey.update({
      where: { id: record.id },
      data: { usageCount: 0, lastResetAt: now },
    })
    record.usageCount = 0
  }

  if (record.usageCount >= record.monthlyLimit) {
    return { ok: false, error: `Monthly usage limit (${record.monthlyLimit}) exceeded. Upgrade your tier at /api-pricing`, status: 429 }
  }

  await prisma.apiKey.update({
    where: { id: record.id },
    data: { usageCount: { increment: 1 }, lastUsedAt: now },
  })

  return { ok: true, key: { id: record.id, tier: record.tier, label: record.label } }
}