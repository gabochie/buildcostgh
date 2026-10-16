export interface CalculatorInput {
  bedrooms: string
  location: string
  floorArea: string
  floors: string
  grade: string
  pool: string
  garden: string
  security: string
  solar: string
}

export interface EstimateResult {
  breakdown: {
    baseCost: number
    locationMultiplier: number
    gradeMultiplier: number
    seasonalMultiplier?: number
    addonsCost: number
    total: number
  }
  categories?: {
    foundation: number
    structure: number
    finishing: number
    services: number
  }
  regionRates?: {
    cement: number
    rebar: number
    block: number
    sand: number
    granite: number
    timber: number
    roofing: number
    diesel: number
    paint: number
    labour: number
  } | null
  summary: {
    pricePerSqm: number
    totalSqm: number
    grade: string
    location: string
  }
  /** True when computed on-device while offline (no seasonal/region-rate data). */
  offline?: boolean
  // Extended fields from the new calculation engine
  extended?: {
    costRange: { low: number; high: number }
    confidenceScore: "low" | "medium" | "high"
    elementalBreakdown: {
      name: string
      amount: number
      percentage: number
      costPerSqm: number
    }[]
    professionalFees: {
      discipline: string
      amount: number
      percentage: number
    }[]
    totalProfessionalFees: number
    contingency: number
    escalation: number
    assumptions: string[]
    exclusions: string[]
    dataSource: string
  }
}

export interface Package {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  popular?: boolean
}

export interface OrderPayload {
  fullName: string
  email: string
  phone: string
  packageName: string
  amount: number
  metadata?: Record<string, unknown>
}
