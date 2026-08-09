import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const limit = await checkRateLimit(ip, { maxAttempts: 5, windowMs: 60000, useDb: false })
    if (!limit.allowed) {
      return NextResponse.json({ error: limit.message || "Too many requests" }, { status: 429 })
    }

    const { name, email, phone } = await request.json()

    if (!name || !email || !email.includes("@") || !phone) {
      return NextResponse.json({ error: "Name, valid email, and phone required" }, { status: 400 })
    }

    // Store as a contact message for lead tracking
    await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone,
        subject: "Flood Risk Report Download",
        message: `Lead magnet signup: Requested the Complete Flood Risk Report. Name: ${name}, Email: ${email}, Phone: ${phone}`,
      },
    })

    // Also subscribe to newsletter
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { name, subscribed: true },
      create: { email, name },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 })
  }
}
