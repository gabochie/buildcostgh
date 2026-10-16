// Fully client-side estimate — mirrors src/app/api/calculator/route.ts legacy path
// so the calculator works with zero connectivity. Uses the same pricing
// constants, so online and offline totals agree for identical inputs.

import {
  BASE_PRICES,
  LOCATION_MULTIPLIERS,
  GRADE_MULTIPLIERS,
  ADDON_COSTS,
  CATEGORY_SPLITS,
  VALIDATION,
} from "@/lib/pricing-constants"
import type { EstimateResult } from "@/types"

const REGION_TO_CITY: Record<string, string> = {
  "Greater Accra": "Accra",
  Kumasi: "Kumasi",
  Ashanti: "Kumasi",
  Western: "Takoradi",
  Central: "Cape Coast",
  Eastern: "Koforidua",
  Volta: "Ho",
  Northern: "Tamale",
  "Upper East": "Bolgatanga",
  "Upper West": "Wa",
  Bono: "Sunyani",
  "Bono East": "Techiman",
  Ahafo: "Goaso",
  "Western North": "Sefwi Wiawso",
  Oti: "Dambai",
  Savannah: "Damongo",
  "North East": "Nalerigu",
}

export interface OfflineCalcInput {
  bedrooms?: string
  location?: string
  floorArea?: string
  floors?: string
  grade?: string
  pool?: string
  garden?: string
  security?: string
  solar?: string
}

export function calculateOfflineEstimate(input: OfflineCalcInput): EstimateResult {
  const area = Number.parseFloat(input.floorArea || "") || VALIDATION.defaultArea
  const clampedArea = Math.max(VALIDATION.minArea, Math.min(VALIDATION.maxArea, area))
  const floorCount =
    input.floors === "Two Floors" ? 2 : input.floors === "Three Floors" ? 3 : 1
  const gradeKey =
    input.grade && GRADE_MULTIPLIERS[input.grade] !== undefined ? input.grade : "B"
  const rawLocation = input.location || "Accra"
  const resolved = REGION_TO_CITY[rawLocation] || rawLocation
  const locationKey =
    LOCATION_MULTIPLIERS[resolved] !== undefined ? resolved : "Accra"

  const basePerSqm = (BASE_PRICES[input.bedrooms || "3"] || 180000) / 100
  const locationMult = LOCATION_MULTIPLIERS[locationKey]
  const gradeMult = GRADE_MULTIPLIERS[gradeKey]
  const baseCost = Math.round(basePerSqm * clampedArea * floorCount * locationMult * gradeMult)

  const addonsCost =
    (ADDON_COSTS.pool[input.pool || ""] || 0) +
    (ADDON_COSTS.garden[input.garden || ""] || 0) +
    (ADDON_COSTS.security[input.security || ""] || 0) +
    (ADDON_COSTS.solar[input.solar || ""] || 0)

  const total = Math.round(baseCost + addonsCost)
  const split = CATEGORY_SPLITS[gradeKey] || CATEGORY_SPLITS.B
  const totalSqm = clampedArea * floorCount

  return {
    breakdown: {
      baseCost,
      locationMultiplier: locationMult,
      gradeMultiplier: gradeMult,
      seasonalMultiplier: 1.0,
      addonsCost,
      total,
    },
    categories: {
      foundation: Math.round(baseCost * split.foundation),
      structure: Math.round(baseCost * split.structure),
      finishing: Math.round(baseCost * split.finishing),
      services: Math.round(baseCost * split.services) + addonsCost,
    },
    regionRates: null,
    summary: {
      pricePerSqm: Math.round(total / totalSqm),
      totalSqm,
      grade: gradeKey,
      location: locationKey,
    },
    offline: true,
  } as EstimateResult
}
