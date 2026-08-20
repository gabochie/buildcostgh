import { NextRequest, NextResponse } from "next/server"
import { authenticateApiKey } from "@/lib/api-auth"
import { LOCATION_MULTIPLIERS } from "@/lib/pricing-constants"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const locations = Object.entries(LOCATION_MULTIPLIERS).map(([region, multiplier]) => ({
    region,
    slug: region.toLowerCase().replace(/\s+/g, "-"),
    multiplier,
  }))

  return NextResponse.json({
    success: true,
    data: locations,
    meta: { requestedBy: auth.key.label, tier: auth.key.tier },
  })
}
