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
import { calculateCost, type CalculationInput } from "@/lib/calculation-engine"
import { apiRateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const rateLimit = await apiRateLimit(request, { maxRequests: 30, path: "calculator" })
    if (!rateLimit.ok) return rateLimit.response!

    const body = await request.json()
    const {
      bedrooms, location, floorArea, floors, grade, pool, garden, security, solar,
      buildingCategorySlug, buildingSubtypeSlug, qualityLevel,
    } = body

    // ── Input validation ──
    const area = Number.parseFloat(floorArea) || VALIDATION.defaultArea
    const clampedArea = Math.max(VALIDATION.minArea, Math.min(VALIDATION.maxArea, area))

    const floorCount =
      floors === "Single Floor" ? 1 : floors === "Two Floors" ? 2 : floors === "Three Floors" ? 3 : Number(floors) || 1

    const gradeKey = GRADE_MULTIPLIERS[grade] !== undefined ? grade : "B"

    // Resolve location name — support both city names (Accra, Kumasi) and region names (Greater Accra, Ashanti)
    const regionToCity: Record<string, string> = {
      "Greater Accra": "Accra", "Ashanti": "Kumasi", "Western": "Takoradi",
      "Central": "Cape Coast", "Eastern": "Koforidua", "Volta": "Ho",
      "Northern": "Tamale", "Upper East": "Bolgatanga", "Upper West": "Wa",
      "Bono": "Sunyani", "Bono East": "Techiman", "Ahafo": "Goaso",
      "Western North": "Sefwi Wiawso", "Oti": "Dambai", "Savannah": "Damongo",
      "North East": "Nalerigu",
    }
    const resolvedLocation = regionToCity[location] || location
    const locationKey = LOCATION_MULTIPLIERS[resolvedLocation] !== undefined ? resolvedLocation : "Accra"

    // ── If building type provided, use the new calculation engine ──
    const categorySlug = buildingCategorySlug || body.buildingCategory
    if (categorySlug) {
      const quality = qualityLevel || (grade === "A" ? "premium" : grade === "C" ? "economy" : "standard")
      const input: CalculationInput = {
        buildingCategorySlug: categorySlug,
        buildingSubtypeSlug,
        location: locationKey,
        floorArea: clampedArea,
        floors: floorCount,
        qualityLevel: quality as CalculationInput["qualityLevel"],
        bedrooms,
      }

      const calc = await calculateCost(input)

      // Seasonal adjustment
      let seasonalMult = 1.0
      const currentMonth = new Date().getMonth() + 1
      try {
        const factors = await prisma.seasonalFactor.findMany({
          where: { active: true, month: currentMonth, OR: [{ region: locationKey }, { region: null }] },
        })
        if (factors.length > 0) {
          seasonalMult = factors.reduce((sum, f) => sum + f.multiplier, 0) / factors.length
        }
      } catch { /* Seasonal factors may not exist */ }

      return NextResponse.json({
        breakdown: {
          baseCost: calc.constructionCost,
          locationMultiplier: LOCATION_MULTIPLIERS[locationKey] ?? 1.0,
          gradeMultiplier: 1.0,
          seasonalMultiplier: seasonalMult,
          addonsCost: calc.externalWorksCost + calc.siteDevelopmentCost,
          total: calc.totalProjectCost,
        },
        categories: {
          foundation: calc.elementalBreakdown.find(e => e.name === "Substructure")?.amount ?? 0,
          structure: calc.elementalBreakdown.find(e => e.name === "Frame")?.amount ?? 0,
          finishing: calc.elementalBreakdown.find(e => e.name === "Internal Finishes")?.amount ?? 0,
          services: calc.elementalBreakdown.reduce((s, e) =>
            ["Mechanical (MEP)", "Electrical (MEP)", "Fire Protection"].includes(e.name) ? s + e.amount : s, 0),
        },
        regionRates: calc.regionRates,
        summary: {
          pricePerSqm: calc.costPerSqm,
          totalSqm: clampedArea * floorCount,
          grade: gradeKey,
          location: locationKey,
        },
        // Extended fields for building type intelligence
        extended: {
          costRange: calc.costRange,
          confidenceScore: calc.confidenceScore,
          elementalBreakdown: calc.elementalBreakdown,
          professionalFees: calc.professionalFees,
          totalProfessionalFees: calc.totalProfessionalFees,
          contingency: calc.contingency,
          escalation: calc.escalation,
          assumptions: calc.assumptions,
          exclusions: calc.exclusions,
          dataSource: calc.dataSource,
        },
      })
    }

    // ── Legacy residential calculator (backward compatible) ──
    const basePerSqm = (BASE_PRICES[bedrooms] || 180000) / 100
    const locationMult = LOCATION_MULTIPLIERS[locationKey]
    const gradeMult = GRADE_MULTIPLIERS[gradeKey]

    let baseCost = basePerSqm * clampedArea * floorCount * locationMult * gradeMult

    // ── Seasonal adjustment ──
    let seasonalMult = 1.0
    const currentMonth = new Date().getMonth() + 1
    try {
      const factors = await prisma.seasonalFactor.findMany({
        where: { active: true, month: currentMonth, OR: [{ region: locationKey }, { region: null }] },
      })
      if (factors.length > 0) {
        seasonalMult = factors.reduce((sum, f) => sum + f.multiplier, 0) / factors.length
      }
    } catch { /* Seasonal factors table may not exist */ }

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
    } catch { /* RegionRate table may not exist */ }

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
