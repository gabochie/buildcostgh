// ── Single source of truth for calculator pricing ──
// All pricing data lives here. Calculator API, v1 API, Step5Result, and report-content
// import from this file to stay in sync.

// ── Base prices per bedroom count (GHS per 100 sqm) ──
export const BASE_PRICES: Record<string, number> = {
  "1": 80000,
  "2": 120000,
  "3": 180000,
  "4": 250000,
  "5": 320000,
  "6+": 400000,
}

// ── Location multipliers (Accra = 1.0 baseline) ──
// All 17 calculator locations + region slug variants for v1 API
export const LOCATION_MULTIPLIERS: Record<string, number> = {
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
  Wa: 0.67,
  Goaso: 0.7,
  Techiman: 0.73,
  Dambai: 0.69,
  "Sefwi Wiawso": 0.76,
  Nalerigu: 0.63,
  Damongo: 0.66,
}

// Slug variants for v1 API (lowercase, hyphenated)
export const LOCATION_SLUG_MULTIPLIERS: Record<string, number> = Object.fromEntries(
  Object.entries(LOCATION_MULTIPLIERS).map(([k, v]) => [k.toLowerCase().replace(/\s+/g, "-"), v])
)

// ── Grade multipliers ──
export const GRADE_MULTIPLIERS: Record<string, number> = {
  C: 1.0,
  B: 1.5,
  A: 2.5,
}

// v1 API grade names
export const V1_GRADE_MULTIPLIERS: Record<string, number> = {
  basic: 0.7,
  standard: 1.0,
  premium: 1.5,
}

// ── Addon costs (GHS) ──
export const ADDON_COSTS: Record<string, Record<string, number>> = {
  pool: { "No Pool": 0, "Small Pool (3x6m)": 40000, "Medium Pool (5x10m)": 75000, "Large Pool (8x15m)": 120000 },
  garden: { "No Garden": 0, "Basic Garden": 5000, "Extensive Landscaping": 20000 },
  security: { "Basic Security": 3000, "Advanced Security": 12000, "Premium Security": 25000 },
  solar: { "No Solar": 0, "Basic Solar System": 25000, "Full Solar System": 60000 },
}

// ── Category breakdown percentages (grade-dependent) ──
// Format: { foundation, structure, finishing, services }
type CategorySplit = { foundation: number; structure: number; finishing: number; services: number }

export const CATEGORY_SPLITS: Record<string, CategorySplit> = {
  C: { foundation: 0.20, structure: 0.35, finishing: 0.35, services: 0.10 },
  B: { foundation: 0.18, structure: 0.34, finishing: 0.38, services: 0.10 },
  A: { foundation: 0.15, structure: 0.30, finishing: 0.43, services: 0.12 },
}

// ── v1 API estimate ranges ──
export const BED_COST_RANGES: Record<string, { min: number; max: number }> = {
  "1": { min: 180000, max: 350000 },
  "2": { min: 250000, max: 650000 },
  "3": { min: 400000, max: 1000000 },
  "4": { min: 600000, max: 1400000 },
  "5": { min: 900000, max: 2000000 },
  "6+": { min: 1200000, max: 3500000 },
}

// v1 API cost breakdown percentages
export const V1_BREAKDOWN_PCTS = { materials: 0.55, labour: 0.25, supervision: 0.08, contingency: 0.12 }

// ── rates.ts display baselines ──
export const GRADE_BASELINES: Record<string, { min: number; max: number }> = {
  basic: { min: 400000, max: 650000 },
  standard: { min: 650000, max: 1000000 },
  premium: { min: 1000000, max: 1500000 },
}

// ── Input validation bounds ──
export const VALIDATION = {
  minArea: 20,
  maxArea: 2000,
  defaultArea: 100,
  validFloors: ["Single Floor", "Two Floors", "Three Floors"] as const,
  validGrades: ["C", "B", "A"] as const,
  validBedrooms: ["1", "2", "3", "4", "5", "6+"] as const,
} as const
