import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown"
  const limit = await checkRateLimit(ip, { maxAttempts: 5, windowMs: 60000, useDb: false })
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message || "Too many requests" }, { status: 429 })
  }

  let body: { email?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const email = body.email?.trim()
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  const rawKey = `bc_${crypto.randomBytes(24).toString("hex")}`
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex")

  const apiKey = await prisma.apiKey.create({
    data: {
      keyHash,
      label: `Self-service: ${email}`,
      tier: "dev",
      monthlyLimit: 100,
      ownerEmail: email,
    },
  })

  return NextResponse.json({
    success: true,
    key: rawKey,
    tier: apiKey.tier,
    monthlyLimit: apiKey.monthlyLimit,
    docs: "/api-docs",
    warning: "Save this key — it will not be shown again",
  })
}