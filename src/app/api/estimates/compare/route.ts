import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// POST /api/estimates/compare — compare two estimates side-by-side
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { ids } = body

  if (!Array.isArray(ids) || ids.length < 2 || ids.length > 4) {
    return NextResponse.json({ error: "Provide 2-4 estimate IDs to compare" }, { status: 400 })
  }

  const estimates = await prisma.savedEstimate.findMany({
    where: { id: { in: ids } },
  })

  if (estimates.length < 2) {
    return NextResponse.json({ error: "At least 2 matching estimates found" }, { status: 404 })
  }

  // Build comparison data
  const comparison = estimates.map((e) => {
    const r = e.result as Record<string, unknown>
    const breakdown = r?.breakdown as Record<string, unknown> | undefined
    const extended = r?.extended as Record<string, unknown> | undefined

    return {
      id: e.id,
      projectName: e.projectName,
      buildingType: e.buildingType,
      location: e.location,
      floorArea: Number(e.floorArea),
      floors: e.floors,
      qualityLevel: e.qualityLevel,
      version: e.version,
      totalCost: Number(breakdown?.total ?? 0),
      baseCost: Number(breakdown?.baseCost ?? 0),
      costPerSqm: Number(breakdown?.costPerSqm ?? 0),
      costRange: extended?.costRange ?? null,
      confidenceScore: extended?.confidenceScore ?? null,
      professionalFees: extended?.totalProfessionalFees ?? null,
      contingency: extended?.contingency ?? null,
      inputs: e.inputs,
      createdAt: e.createdAt,
    }
  })

  // Calculate deltas between first and each other
  const baseline = comparison[0]
  const withDeltas = comparison.map((c, i) => ({
    ...c,
    delta: i === 0 ? null : {
      totalCost: c.totalCost - baseline.totalCost,
      totalCostPct: baseline.totalCost ? ((c.totalCost - baseline.totalCost) / baseline.totalCost * 100).toFixed(1) : "0",
      costPerSqm: c.costPerSqm - baseline.costPerSqm,
      floorArea: c.floorArea - baseline.floorArea,
    },
  }))

  return NextResponse.json({ estimates: withDeltas, baselineId: baseline.id })
}
