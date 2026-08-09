import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const factors = await prisma.seasonalFactor.findMany({ orderBy: [{ region: "asc" }, { month: "asc" }] })
  return NextResponse.json(factors.map(f => ({ ...f, monthLabel: MONTHS[f.month - 1] || f.month })))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  if (!body.month || !body.multiplier) {
    return NextResponse.json({ error: "month and multiplier required" }, { status: 400 })
  }

  const factor = await prisma.seasonalFactor.create({
    data: {
      region: body.region || null,
      month: Number(body.month),
      material: body.material || null,
      multiplier: Number(body.multiplier),
      reason: body.reason || null,
      active: body.active !== false,
    },
  })
  return NextResponse.json(factor)
}
