// ── Shared Calculation Engine ──
// Single entry point for all building type cost estimates.
// Residential backward-compatibility preserved via BuildingCategory "residential" + existing base prices.

import { PrismaClient, BuildingSubtype, CostProfile } from '@prisma/client'
import { LOCATION_MULTIPLIERS } from './pricing-constants'

const prisma = new PrismaClient()

// ── Input Types ──
export interface CalculationInput {
  buildingCategorySlug: string
  buildingSubtypeSlug?: string
  location: string
  floorArea: number        // sqm
  floors: number
  qualityLevel: 'economy' | 'standard' | 'good' | 'premium' | 'luxury'
  // Residential backward-compat
  bedrooms?: string        // "1"-"6+" — used only when category is residential
  // Optional overrides
  siteConditions?: {
    terrain?: 'flat' | 'sloping' | 'steep'
    access?: 'easy' | 'moderate' | 'difficult'
    setting?: 'urban' | 'peri_urban' | 'rural'
  }
}

// ── Output Types ──
export interface ElementalCost {
  name: string
  amount: number
  percentage: number
  costPerSqm: number
}

export interface ProfessionalFee {
  discipline: string
  amount: number
  percentage: number
}

export interface CalculationResult {
  // Core
  totalCost: number
  costPerSqm: number
  costRange: { low: number; high: number }
  confidenceScore: 'low' | 'medium' | 'high'

  // Elemental breakdown
  elementalBreakdown: ElementalCost[]

  // Components
  constructionCost: number
  externalWorksCost: number
  siteDevelopmentCost: number

  // Professional fees
  professionalFees: ProfessionalFee[]
  totalProfessionalFees: number

  // Totals
  contingency: number
  escalation: number
  totalProjectCost: number

  // Metadata
  assumptions: string[]
  exclusions: string[]
  dataSource: string
  calculatedAt: Date

  // Legacy compat (for existing Step5Result)
  categories: Record<string, number>
  regionRates: Record<string, number> | null
  seasonalMultiplier: number
}

// ── Bed-based fallback for residential backward-compat ──
// Matches the old pricing-constants.ts BASE_PRICES when no CostProfile found
const RESIDENTIAL_BASE_PRICES: Record<string, number> = {
  '1': 80000,   '2': 120000,  '3': 180000,
  '4': 250000,  '5': 320000,  '6+': 400000,
}

const GRADE_MULT: Record<string, number> = { C: 1.0, B: 1.5, A: 2.5 }

const SITE_TERRAIN_FACTORS: Record<string, number> = { flat: 1.0, sloping: 1.05, steep: 1.12 }
const SITE_ACCESS_FACTORS: Record<string, number> = { easy: 1.0, moderate: 1.03, difficult: 1.08 }
const SITE_SETTING_FACTORS: Record<string, number> = { urban: 1.0, peri_urban: 0.97, rural: 0.93 }

const PROFESSIONAL_DISCIPLINES: Record<string, string> = {
  architectFeePct: 'Architect',
  qsFeePct: 'Quantity Surveyor',
  structuralEngFeePct: 'Structural Engineer',
  civilEngFeePct: 'Civil Engineer',
  mechanicalEngFeePct: 'Mechanical Engineer',
  electricalEngFeePct: 'Electrical Engineer',
  geotechFeePct: 'Geotechnical Engineer',
  pmFeePct: 'Project Manager',
}

export async function calculateCost(input: CalculationInput): Promise<CalculationResult> {
  const assumptions: string[] = []
  const exclusions: string[] = [
    'Land acquisition cost',
    'Statutory fees and permits',
    'Furniture, fixtures and equipment (FF&E)',
    'VAT and other applicable taxes',
    'Financing costs',
    'Professional fee negotiations',
  ]

  // 1. Look up building category
  const category = await prisma.buildingCategory.findUnique({
    where: { slug: input.buildingCategorySlug },
    include: { costProfiles: { where: { isActive: true } } },
  })
  if (!category) throw new Error(`Unknown building category: ${input.buildingCategorySlug}`)

  // 2. Look up subtype (optional)
  let subtype: BuildingSubtype | null = null
  if (input.buildingSubtypeSlug) {
    subtype = await prisma.buildingSubtype.findUnique({ where: { slug: input.buildingSubtypeSlug } })
    if (!subtype) throw new Error(`Unknown building subtype: ${input.buildingSubtypeSlug}`)
  }

  // 3. Find best cost profile (subtype-specific > category-level)
  let profile = category.costProfiles.find(
    p => p.subtypeId === subtype?.id && p.qualityLevel === input.qualityLevel
  )
  if (!profile) {
    profile = category.costProfiles.find(
      p => p.subtypeId === null && p.qualityLevel === input.qualityLevel
    )
  }
  // Fallback to 'standard' if requested quality not found
  if (!profile) {
    profile = category.costProfiles.find(p => p.subtypeId === null && p.qualityLevel === 'standard')
    assumptions.push(`Quality level "${input.qualityLevel}" not available; using "standard" profile.`)
  }

  // 4. Residential backward-compat: use bed-based pricing if it's residential and no profile
  let baseCostPerSqm: number
  let isResidentialLegacy = false

  if (!profile && category.slug === 'residential' && input.bedrooms) {
    const bedBase = RESIDENTIAL_BASE_PRICES[input.bedrooms] ?? 180000
    const gradeMult = GRADE_MULT[input.qualityLevel === 'economy' ? 'C' : input.qualityLevel === 'premium' ? 'A' : 'B'] ?? 1.5
    baseCostPerSqm = (bedBase * gradeMult) / 100  // BASE_PRICES are per 100 sqm
    isResidentialLegacy = true
    assumptions.push('Using residential bed-based pricing (legacy mode).')
  } else if (profile) {
    baseCostPerSqm = Number(profile.baseCostPerSqm)
  } else {
    throw new Error(`No cost profile found for ${category.name} / ${input.qualityLevel}`)
  }

  // 5. Location multiplier
  const locationMult = LOCATION_MULTIPLIERS[input.location] ?? 1.0
  if (!LOCATION_MULTIPLIERS[input.location]) {
    assumptions.push(`Location "${input.location}" not in database; using Accra baseline (1.0).`)
  }

  // 6. Site condition factors
  const terrainMult = SITE_TERRAIN_FACTORS[input.siteConditions?.terrain ?? 'flat']
  const accessMult = SITE_ACCESS_FACTORS[input.siteConditions?.access ?? 'easy']
  const settingMult = SITE_SETTING_FACTORS[input.siteConditions?.setting ?? 'urban']
  const siteFactor = terrainMult * accessMult * settingMult
  if (siteFactor !== 1.0) {
    assumptions.push(`Site conditions applied: terrain=${input.siteConditions?.terrain ?? 'flat'}, access=${input.siteConditions?.access ?? 'easy'}, setting=${input.siteConditions?.setting ?? 'urban'}`)
  }

  // 7. Core calculation
  const adjustedBaseCost = baseCostPerSqm * locationMult * siteFactor
  const constructionCost = adjustedBaseCost * input.floorArea

  // 8. Elemental breakdown
  let elementalBreakdown: ElementalCost[] = []

  if (profile) {
    const elements = [
      { name: 'Substructure', pct: Number(profile.substructurePct) },
      { name: 'Frame', pct: Number(profile.framePct) },
      { name: 'Upper Floors', pct: Number(profile.upperFloorsPct) },
      { name: 'Roof', pct: Number(profile.roofPct) },
      { name: 'External Walls', pct: Number(profile.externalWallsPct) },
      { name: 'Windows & Doors', pct: Number(profile.windowsDoorsPct) },
      { name: 'Internal Finishes', pct: Number(profile.internalFinishesPct) },
      { name: 'External Finishes', pct: Number(profile.externalFinishesPct) },
      { name: 'Fittings', pct: Number(profile.fittingsPct) },
      { name: 'Mechanical (MEP)', pct: Number(profile.mechanicalPct) },
      { name: 'Electrical (MEP)', pct: Number(profile.electricalPct) },
      { name: 'Fire Protection', pct: Number(profile.fireProtectionPct) },
    ]
    elementalBreakdown = elements.map(e => ({
      name: e.name,
      amount: Math.round(constructionCost * e.pct),
      percentage: Math.round(e.pct * 1000) / 10,
      costPerSqm: Math.round((constructionCost * e.pct) / input.floorArea),
    }))
  }

  // 9. External works + site development
  const externalWorksPct = profile ? Number(profile.externalWorksPct) : 0.10
  const siteDevelopmentPct = profile ? Number(profile.siteDevelopmentPct) : 0.05
  const externalWorksCost = Math.round(constructionCost * externalWorksPct)
  const siteDevelopmentCost = Math.round(constructionCost * siteDevelopmentPct)

  // 10. Professional fees
  const professionalFees: ProfessionalFee[] = []
  let totalProfessionalFees = 0
  if (profile) {
    for (const [key, label] of Object.entries(PROFESSIONAL_DISCIPLINES)) {
      const val = profile[key as keyof CostProfile]
      const pct = typeof val === 'object' && val !== null && 'toNumber' in val ? Number(val) : Number(val ?? 0)
      if (pct > 0) {
        const amount = Math.round(constructionCost * pct)
        professionalFees.push({ discipline: label, amount, percentage: Math.round(pct * 1000) / 10 })
        totalProfessionalFees += amount
      }
    }
  }

  // 11. Contingency + escalation
  const contingencyPct = profile ? Number(profile.contingencyPct) : 0.10
  const escalationPct = profile ? Number(profile.escalationPct) : 0.05
  const subtotal = constructionCost + externalWorksCost + siteDevelopmentCost + totalProfessionalFees
  const contingency = Math.round(subtotal * contingencyPct)
  const escalation = Math.round(subtotal * escalationPct)

  // 12. Total project cost
  const totalProjectCost = subtotal + contingency + escalation
  const costPerSqm = Math.round(totalProjectCost / input.floorArea)

  // 13. Cost range
  const rangeFactor = profile ? Number(profile.rangeFactor) : 1.0
  const rangePct = 0.15 * rangeFactor
  const costRange = {
    low: Math.round(totalProjectCost * (1 - rangePct)),
    high: Math.round(totalProjectCost * (1 + rangePct)),
  }

  // 14. Confidence score
  const confidenceScore: 'low' | 'medium' | 'high' = profile
    ? (profile.confidenceLevel as 'low' | 'medium' | 'high')
    : 'low'

  // 15. DB region rates for material prices
  const regionRecord = await prisma.regionRate.findUnique({ where: { name: input.location } })
  const regionRates: Record<string, number> | null = regionRecord ? {
    cement: regionRecord.cementBag,
    rebar: regionRecord.rebarTon,
    blocks: regionRecord.block,
    sand: regionRecord.sandTrip,
    granite: regionRecord.graniteTrip,
    timber: regionRecord.timber,
    roofing: regionRecord.roofingSqm,
    paint: regionRecord.paintLit,
    labour: regionRecord.labourRate,
  } : null

  // 16. Legacy category splits for Step5Result compat
  const gradeKey = input.qualityLevel === 'economy' ? 'C' : input.qualityLevel === 'premium' || input.qualityLevel === 'luxury' ? 'A' : 'B'
  const legacySplits = isResidentialLegacy ? (() => {
    const splits: Record<string, number> = { C: 0.20, B: 0.18, A: 0.15 }
    const foundationPct = splits[gradeKey] ?? 0.18
    return {
      foundation: Math.round(constructionCost * foundationPct),
      structure: Math.round(constructionCost * (gradeKey === 'A' ? 0.30 : gradeKey === 'B' ? 0.34 : 0.35)),
      finishing: Math.round(constructionCost * (gradeKey === 'A' ? 0.43 : gradeKey === 'B' ? 0.38 : 0.35)),
      services: Math.round(constructionCost * (gradeKey === 'A' ? 0.12 : 0.10)),
    }
  })() : null

  // 17. Assumptions
  assumptions.push(
    `Base cost: GH₵${baseCostPerSqm.toLocaleString()}/sqm (${category.name}${subtype ? ' / ' + subtype.name : ''}, ${input.qualityLevel} quality)`,
    `Location multiplier: ${locationMult}x (${input.location})`,
    `Floor area: ${input.floorArea} sqm across ${input.floors} floor(s)`,
    `All costs are indicative estimates. Actual costs may vary based on market conditions, specifications, and site实际情况.`,
    `Source: ${profile?.source ?? 'BuildCostGH Indicative Dataset v2026.08'}`,
  )

  return {
    totalCost: totalProjectCost,
    costPerSqm,
    costRange,
    confidenceScore,
    elementalBreakdown,
    constructionCost: Math.round(constructionCost),
    externalWorksCost,
    siteDevelopmentCost,
    professionalFees,
    totalProfessionalFees,
    contingency,
    escalation,
    totalProjectCost: Math.round(totalProjectCost),
    assumptions,
    exclusions,
    dataSource: profile?.source ?? 'BuildCostGH Indicative Dataset v2026.08',
    calculatedAt: new Date(),
    // Legacy compat
    categories: legacySplits ?? {
      foundation: Math.round(constructionCost * 0.18),
      structure: Math.round(constructionCost * 0.34),
      finishing: Math.round(constructionCost * 0.38),
      services: Math.round(constructionCost * 0.10),
    },
    regionRates,
    seasonalMultiplier: 1.0,
  }
}
