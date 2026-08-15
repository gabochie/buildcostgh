import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!isAdmin(session?.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const numFields = ["multiplier", "labourRate", "cementBag", "rebarTon", "block", "sandTrip", "graniteTrip", "timber", "roofingSqm", "dieselLit", "paintLit"] as const

  const data: Record<string, unknown> = {}
  for (const f of numFields) {
    if (body[f] !== undefined) data[f] = Number(body[f])
  }
  if (body.name !== undefined) data.name = body.name
  if (body.capital !== undefined) data.capital = body.capital
  if (body.source !== undefined) data.source = body.source
  if (body.notes !== undefined) data.notes = body.notes
  if (body.published !== undefined) data.published = !!body.published

  const rate = await prisma.regionRate.update({ where: { id }, data })
  return NextResponse.json(rate)
}
