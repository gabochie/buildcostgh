import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"
import { checkRateLimit } from "@/lib/rate-limit"
import { ADMIN_EMAIL } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown"

    const rateCheck = await checkRateLimit(ip, { maxAttempts: 10, path: "register" })
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 })
    }

    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : ""
    const phone = typeof body.phone === "string" ? body.phone.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!name) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }
    if (email === ADMIN_EMAIL) {
      return NextResponse.json({ error: "This email is reserved. Please use a different one." }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)

    await prisma.user.create({
      data: { name, email, phone: phone || null, passwordHash },
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
