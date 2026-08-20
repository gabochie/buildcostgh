import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateApiKey } from "@/lib/api-auth"
import {
  LOCATION_SLUG_MULTIPLIERS,
  V1_GRADE_MULTIPLIERS,
  BED_COST_RANGES,
  V1_BREAKDOWN_PCTS,
} from "@/lib/pricing-constants"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: { bedrooms?: string | number; location?: string; finishGrade?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { bedrooms, location, finishGrade = "standard" } = body

  if (!bedrooms || !location) {
    return NextResponse.json({ error: "bedrooms and location required" }, { status: 400 })
  }

  const locSlug = location.toLowerCase().replace(/\s+/g, "-")
  const multiplier = LOCATION_SLUG_MULTIPLIERS[locSlug] ?? 0.85
  const bedRange = BED_COST_RANGES[String(bedrooms)] ?? BED_COST_RANGES["3"]

  const gradeMultiplier = V1_GRADE_MULTIPLIERS[finishGrade] ?? V1_GRADE_MULTIPLIERS.standard
  const min = Math.round(bedRange.min * multiplier * gradeMultiplier)
  const max = Math.round(bedRange.max * multiplier * gradeMultiplier)

  return NextResponse.json({
    success: true,
    data: {
      estimate: { min, max, currency: "GHS" },
      details: { bedrooms: String(bedrooms), location, finishGrade },
      breakdown: {
        materials: Math.round(min * V1_BREAKDOWN_PCTS.materials),
        labour: Math.round(min * V1_BREAKDOWN_PCTS.labour),
        supervision: Math.round(min * V1_BREAKDOWN_PCTS.supervision),
        contingency: Math.round(min * V1_BREAKDOWN_PCTS.contingency),
      },
    },
    meta: { requestedBy: auth.key.label, tier: auth.key.tier },
  })
}
