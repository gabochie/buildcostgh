import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  BASE_PRICES,
  LOCATION_MULTIPLIERS,
  GRADE_MULTIPLIERS,
  ADDON_COSTS,
  CATEGORY_SPLITS,
  VALIDATION,
} from "@/lib/pricing-constants"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { bedrooms, location, floorArea, floors, grade, pool, garden, security, solar } = body

    // ── Input validation ──
    const area = Number.parseFloat(floorArea) || VALIDATION.defaultArea
    const clampedArea = Math.max(VALIDATION.minArea, Math.min(VALIDATION.maxArea, area))

    const floorCount =
      floors === "Single Floor" ? 1 : floors === "Two Floors" ? 2 : floors === "Three Floors" ? 3 : 1

    const gradeKey = GRADE_MULTIPLIERS[grade] !== undefined ? grade : "B"
    const locationKey = LOCATION_MULTIPLIERS[location] !== undefined ? location : "Accra"

    // ── Base calculation ──
    const basePerSqm = (BASE_PRICES[bedrooms] || 180000) / 100
    const locationMult = LOCATION_MULTIPLIERS[locationKey]
    const gradeMult = GRADE_MULTIPLIERS[gradeKey]

    let baseCost = basePerSqm * clampedArea * floorCount * locationMult * gradeMult

    // ── Seasonal adjustment (current month, region-specific) ──
    let seasonalMult = 1.0
    const currentMonth = new Date().getMonth() + 1
    try {
      const factors = await prisma.seasonalFactor.findMany({
        where: {
          active: true,
          month: currentMonth,
          OR: [
            { region: locationKey },
            { region: null },
          ],
        },
      })
      if (factors.length > 0) {
        // Average all matching factors (region-specific + national)
        seasonalMult = factors.reduce((sum, f) => sum + f.multiplier, 0) / factors.length
      }
    } catch {
      // Seasonal factors table may not exist yet — proceed without adjustment
    }

    baseCost *= seasonalMult

    // ── Addons ──
    const addonsCost =
      (ADDON_COSTS.pool[pool] || 0) +
      (ADDON_COSTS.garden[garden] || 0) +
      (ADDON_COSTS.security[security] || 0) +
      (ADDON_COSTS.solar[solar] || 0)

    const total = Math.round(baseCost + addonsCost)

    // ── Grade-dependent category split ──
    const split = CATEGORY_SPLITS[gradeKey] || CATEGORY_SPLITS.B

    // ── Fetch region rates for material-level detail ──
    let regionRates: {
      cementBag: number; rebarTon: number; block: number; sandTrip: number
      graniteTrip: number; timber: number; roofingSqm: number; dieselLit: number; paintLit: number
      labourRate: number
    } | null = null

    try {
      const slug = locationKey.toLowerCase().replace(/\s+/g, "-")
      // Map calculator location names to region slugs
      const slugMap: Record<string, string> = {
        accra: "greater-accra", kumasi: "ashanti", tema: "greater-accra",
        takoradi: "western", tamale: "northern", "cape-coast": "central",
        sunyani: "bono", ho: "volta", koforidua: "eastern",
        bolgatanga: "upper-east", wa: "upper-west", goaso: "ahafo",
        techiman: "bono-east", dambai: "oti", "sefwi-wiawso": "western-north",
        nalerigu: "north-east", damongo: "savannah",
      }
      const regionSlug = slugMap[slug] || slug
      regionRates = await prisma.regionRate.findUnique({ where: { slug: regionSlug } })
    } catch {
      // RegionRate table may not exist yet
    }

    return NextResponse.json({
      breakdown: {
        baseCost: Math.round(baseCost),
        locationMultiplier: locationMult,
        gradeMultiplier: gradeMult,
        seasonalMultiplier: seasonalMult,
        addonsCost,
        total,
      },
      categories: {
        foundation: Math.round(baseCost * split.foundation),
        structure: Math.round(baseCost * split.structure),
        finishing: Math.round(baseCost * split.finishing),
        services: Math.round(baseCost * split.services) + addonsCost,
      },
      regionRates: regionRates
        ? {
            cement: regionRates.cementBag,
            rebar: regionRates.rebarTon,
            block: regionRates.block,
            sand: regionRates.sandTrip,
            granite: regionRates.graniteTrip,
            timber: regionRates.timber,
            roofing: regionRates.roofingSqm,
            diesel: regionRates.dieselLit,
            paint: regionRates.paintLit,
            labour: regionRates.labourRate,
          }
        : null,
      summary: {
        pricePerSqm: Math.round(total / (clampedArea * floorCount)),
        totalSqm: clampedArea * floorCount,
        grade: gradeKey,
        location: locationKey,
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to calculate estimate" }, { status: 500 })
  }
}
