import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rate-limit"

export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const leads = await prisma.calculatorLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return NextResponse.json(leads)
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const limit = await checkRateLimit(ip, { maxAttempts: 5, windowMs: 60000, useDb: false })
    if (!limit.allowed) {
      return NextResponse.json({ error: limit.message || "Too many requests" }, { status: 429 })
    }

    const { email, bedrooms, location, floorArea, floors } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const lead = await prisma.calculatorLead.create({
      data: {
        email,
        bedrooms: bedrooms || null,
        location: location || null,
        floorArea: floorArea || null,
        floors: floors || null,
      },
    })

    return NextResponse.json({ id: lead.id, success: true })
  } catch (error) {
    console.error("Save lead error:", error)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}
