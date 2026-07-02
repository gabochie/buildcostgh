import { NextResponse } from "next/server"

const BASE_PRICES: Record<string, number> = {
  "1": 80000,
  "2": 120000,
  "3": 180000,
  "4": 250000,
  "5": 320000,
  "6+": 400000,
}

const LOCATION_MULTIPLIERS: Record<string, number> = {
  Accra: 1.0,
  Kumasi: 0.85,
  Tema: 0.9,
  Takoradi: 0.8,
  Tamale: 0.7,
  "Cape Coast": 0.75,
  Sunyani: 0.72,
  Ho: 0.68,
  Koforidua: 0.7,
  Bolgatanga: 0.65,
}

const GRADE_MULTIPLIERS: Record<string, number> = {
  C: 1.0,
  B: 1.5,
  A: 2.5,
}

const ADDON_COSTS: Record<string, Record<string, number>> = {
  pool: { "No Pool": 0, "Small Pool (3x6m)": 40000, "Medium Pool (5x10m)": 75000, "Large Pool (8x15m)": 120000 },
  garden: { "No Garden": 0, "Basic Garden": 5000, "Extensive Landscaping": 20000 },
  security: { "Basic Security": 3000, "Advanced Security": 12000, "Premium Security": 25000 },
  solar: { "No Solar": 0, "Basic Solar System": 25000, "Full Solar System": 60000 },
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { bedrooms, location, floorArea, floors, grade, pool, garden, security, solar } = body

    const area = Number.parseFloat(floorArea) || 100
    const floorCount = floors === "Single Floor" ? 1 : floors === "Two Floors" ? 2 : 3

    const basePerSqm = (BASE_PRICES[bedrooms] || 180000) / 100
    const locationMult = LOCATION_MULTIPLIERS[location] || 1.0
    const gradeMult = GRADE_MULTIPLIERS[grade] || 1.0

    const baseCost = basePerSqm * area * floorCount * locationMult * gradeMult

    const addonsCost =
      (ADDON_COSTS.pool[pool] || 0) +
      (ADDON_COSTS.garden[garden] || 0) +
      (ADDON_COSTS.security[security] || 0) +
      (ADDON_COSTS.solar[solar] || 0)

    const total = Math.round(baseCost + addonsCost)

    return NextResponse.json({
      breakdown: {
        baseCost: Math.round(baseCost),
        locationMultiplier: locationMult,
        gradeMultiplier: gradeMult,
        addonsCost,
        total,
      },
      summary: {
        pricePerSqm: Math.round(total / (area * floorCount)),
        totalSqm: area * floorCount,
        grade,
        location,
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to calculate estimate" }, { status: 500 })
  }
}
