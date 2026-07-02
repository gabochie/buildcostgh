import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const leads = await prisma.calculatorLead.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return NextResponse.json(leads)
}

export async function POST(request: Request) {
  try {
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
