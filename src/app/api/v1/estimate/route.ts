import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateApiKey } from "@/lib/api-auth"
import {
  LOCATION_SLUG_MULTIPLIERS,
  V1_GRADE_MULTIPLIERS,
  BED_COST_RANGES,
  V1_BREAKDOWN_PCTS,
} from "@/lib/pricing-constants"
import { calculateCost, type CalculationInput } from "@/lib/calculation-engine"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: {
    bedrooms?: string | number
    location?: string
    finishGrade?: string
    buildingCategory?: string
    buildingSubtype?: string
    floorArea?: number
    floors?: number
    quality?: string
  }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  // ── New building-type mode ──
  if (body.buildingCategory && body.location && body.floorArea) {
    const locationSlug = body.location.toLowerCase().replace(/\s+/g, "-")
    const locationName = Object.entries(LOCATION_SLUG_MULTIPLIERS).find(([k]) => k === locationSlug)?.[0]
      ?? body.location

    try {
      const input: CalculationInput = {
        buildingCategorySlug: body.buildingCategory,
        buildingSubtypeSlug: body.buildingSubtype,
        location: locationName,
        floorArea: body.floorArea,
        floors: body.floors ?? 1,
        qualityLevel: (body.quality ?? body.finishGrade ?? "standard") as CalculationInput["qualityLevel"],
      }

      const result = await calculateCost(input)

      return NextResponse.json({
        success: true,
        data: {
          estimate: { min: result.costRange.low, max: result.costRange.high, currency: "GHS" },
          total: result.totalProjectCost,
          costPerSqm: result.costPerSqm,
          confidence: result.confidenceScore,
          elementalBreakdown: result.elementalBreakdown,
          professionalFees: result.professionalFees,
          assumptions: result.assumptions,
          exclusions: result.exclusions,
          dataSource: result.dataSource,
          details: {
            buildingCategory: body.buildingCategory,
            buildingSubtype: body.buildingSubtype,
            location: body.location,
            floorArea: body.floorArea,
            floors: body.floors,
            quality: body.quality ?? body.finishGrade,
          },
        },
        meta: { requestedBy: auth.key.label, tier: auth.key.tier },
      })
    } catch (e) {
      return NextResponse.json({
        error: `Calculation failed: ${e instanceof Error ? e.message : "Unknown error"}`,
      }, { status: 400 })
    }
  }

  // ── Legacy bedrooms mode (backward compatible) ──
  const { bedrooms, location, finishGrade = "standard" } = body

  if (!bedrooms || !location) {
    return NextResponse.json({ error: "bedrooms and location required (or use buildingCategory + floorArea)" }, { status: 400 })
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
