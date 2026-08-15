import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const rates = await prisma.regionRate.findMany({ orderBy: { multiplier: "desc" } })
  return NextResponse.json(rates)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  if (!body.name || !body.capital || !body.slug) {
    return NextResponse.json({ error: "name, capital and slug required" }, { status: 400 })
  }

  const rate = await prisma.regionRate.create({
    data: {
      name: body.name,
      capital: body.capital,
      slug: body.slug.toLowerCase().replace(/\s+/g, "-"),
      multiplier: Number(body.multiplier ?? 1),
      labourRate: Number(body.labourRate ?? 0),
      cementBag: Number(body.cementBag ?? 0),
      rebarTon: Number(body.rebarTon ?? 0),
      block: Number(body.block ?? 0),
      sandTrip: Number(body.sandTrip ?? 0),
      graniteTrip: Number(body.graniteTrip ?? 0),
      timber: Number(body.timber ?? 0),
      roofingSqm: Number(body.roofingSqm ?? 0),
      dieselLit: Number(body.dieselLit ?? 0),
      paintLit: Number(body.paintLit ?? 0),
      source: body.source || null,
      notes: body.notes || null,
      published: body.published !== false,
    },
  })
  return NextResponse.json(rate)
}
