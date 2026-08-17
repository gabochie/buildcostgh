import { NextRequest, NextResponse } from "next/server"
import crypto from "node:crypto"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOKEN_BYTES = 32
const TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 hour

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown"

    const rateCheck = await checkRateLimit(ip, { maxAttempts: 5, useDb: false })
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 })
    }

    const body = await request.json()
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : ""

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ ok: true })
    }

    // Invalidate any existing unused tokens for this user
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    })

    const token = crypto.randomBytes(TOKEN_BYTES).toString("hex")
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS)

    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt },
    })

    const resetUrl = `${request.nextUrl.origin}/reset-password?token=${token}`

    // TODO: send email. For now, return the link in dev.
    const isDev = process.env.NODE_ENV !== "production"
    return NextResponse.json({
      ok: true,
      ...(isDev && { resetUrl }),
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
