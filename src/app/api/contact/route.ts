import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rate-limit"
import { verifyTurnstileToken } from "@/lib/turnstile"

export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(messages)
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const limit = await checkRateLimit(ip, { maxAttempts: 5, windowMs: 60000, useDb: false })
    if (!limit.allowed) {
      return NextResponse.json({ error: limit.message || "Too many requests" }, { status: 429 })
    }

    const body = await request.json()
    const { name, email, phone, subject, message, turnstileToken } = body

    if (turnstileToken !== undefined) {
      const valid = await verifyTurnstileToken(turnstileToken, ip)
      if (!valid) {
        return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 403 })
      }
    }

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 })
    }

    await prisma.contactMessage.create({
      data: { name, email, phone, subject, message },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("Contact form error:", e)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
