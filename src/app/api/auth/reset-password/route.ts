import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import { checkRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

const MIN_PASSWORD_LENGTH = 8
const TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 hour

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown"

    const rateCheck = await checkRateLimit(ip, { maxAttempts: 10, useDb: false })
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 })
    }

    const body = await request.json()
    const token = typeof body.token === "string" ? body.token.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!token || token.length !== 64) {
      return NextResponse.json({ error: "Invalid reset link" }, { status: 400 })
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const resetRecord = await prisma.passwordReset.findUnique({ where: { token } })

    if (!resetRecord || resetRecord.usedAt) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 })
    }
    if (resetRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "Reset link has expired. Please request a new one." }, { status: 400 })
    }

    const passwordHash = await hashPassword(password)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
