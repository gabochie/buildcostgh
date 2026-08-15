import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const rates = await prisma.regionRate
    .findMany({
      where: { published: true },
      orderBy: [{ multiplier: "desc" }, { name: "asc" }],
      select: {
        name: true,
        slug: true,
        capital: true,
        multiplier: true,
        labourRate: true,
        cementBag: true,
        rebarTon: true,
        block: true,
        sandTrip: true,
        graniteTrip: true,
        timber: true,
        roofingSqm: true,
        dieselLit: true,
        paintLit: true,
        source: true,
        notes: true,
        updatedAt: true,
      },
    })
    .catch(() => [])

  const units = {
    labourRate: "GHS per day (typical skilled artisan)",
    cementBag: "GHS per 50kg bag",
    rebarTon: "GHS per tonne",
    block: "GHS per block",
    sandTrip: "GHS per tipper trip",
    graniteTrip: "GHS per tipper trip",
    timber: "GHS per standard length",
    roofingSqm: "GHS per SQM installed",
    dieselLit: "GHS per litre (NPA benchmark)",
    paintLit: "GHS per litre",
  }

  return NextResponse.json({
    updatedAt: rates[0]?.updatedAt || new Date().toISOString(),
    baseline: "Greater Accra = 1.00",
    units,
    regions: rates,
  })
}
