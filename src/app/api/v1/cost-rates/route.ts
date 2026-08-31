import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateApiKey, apiKeyErrorResponse } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return apiKeyErrorResponse(auth)

  const region = req.nextUrl.searchParams.get("region")

  const where: Record<string, unknown> = { published: true }
  if (region) where.slug = region.toLowerCase().replace(/\s+/g, "-")

  const rates = await prisma.regionRate.findMany({
    where,
    orderBy: { multiplier: "desc" },
  })

  return NextResponse.json({
    success: true,
    data: rates.map(r => ({
      region: r.name,
      slug: r.slug,
      capital: r.capital,
      multiplier: Number(r.multiplier),
      labourRate: Number(r.labourRate),
      cementBag: Number(r.cementBag),
      rebarTon: Number(r.rebarTon),
      block: Number(r.block),
      sandTrip: Number(r.sandTrip),
      graniteTrip: Number(r.graniteTrip),
      timber: Number(r.timber),
      roofingSqm: Number(r.roofingSqm),
      dieselLit: Number(r.dieselLit),
      paintLit: Number(r.paintLit),
      source: r.source,
      lastUpdated: r.updatedAt,
    })),
    meta: { requestedBy: auth.key.label, tier: auth.key.tier, count: rates.length },
  })
}
