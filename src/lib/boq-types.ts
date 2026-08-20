// BOQ Readiness — Data types and export structure
// Prepares for future preliminary BOQ, elemental cost plans, trade packages, and tender documents.
// Does NOT attempt a full professional BOQ engine — just structures data for future integration.

import type { ElementalCost, ProfessionalFee } from "./calculation-engine"

// ── Elemental Cost Plan (highest-level BOQ output) ──
export interface ElementalCostPlan {
  projectName: string
  buildingType: string
  location: string
  floorArea: number
  floors: number
  qualityLevel: string
  currency: string
  generatedAt: string

  elements: ElementalCostPlanItem[]
  professionalFees: ProfessionalFeeItem[]
  contingency: number
  escalation: number
  totalProjectCost: number
  costPerSqm: number
}

export interface ElementalCostPlanItem {
  element: string          // "Substructure", "Frame", "Roof", etc.
  cost: number
  percentage: number
  costPerSqm: number
  notes?: string
}

export interface ProfessionalFeeItem {
  discipline: string       // "Architect", "Quantity Surveyor", etc.
  amount: number
  percentage: number
}

// ── Trade Package (mid-level BOQ breakdown) ──
export interface TradePackage {
  id: string
  name: string             // "Earthworks", "Concrete", "Roofing", etc.
  description: string
  estimatedCost: number
  costPerSqm: number
  unit: string             // "sqm", "m3", "kg", "nr", "ls"
  quantity: number
  rate: number
  element: string          // Parent elemental category
}

// ── Preliminary BOQ Line Item (detailed BOQ output) ──
export interface BOQLineItem {
  itemNo: string           // "1.1", "1.2", "2.1", etc.
  description: string
  unit: string
  quantity: number
  rate: number
  amount: number
  category: string         // "Preliminaries", "Substructure", "Superstructure", etc.
  tradePackage: string
}

// ── Tender Package (high-level procurement output) ──
export interface TenderPackage {
  projectName: string
  packageNo: string
  title: string
  description: string
  scope: string[]
  estimatedValue: number
  currency: string
  tenderDeadline?: string
  documents: string[]       // Required tender documents
  evaluationCriteria: string[]
}

// ── Conversion helpers ──
export function elementalCostsToPlan(
  projectName: string,
  buildingType: string,
  location: string,
  floorArea: number,
  floors: number,
  qualityLevel: string,
  elementalBreakdown: ElementalCost[],
  professionalFees: ProfessionalFee[],
  contingency: number,
  escalation: number,
  totalProjectCost: number,
): ElementalCostPlan {
  return {
    projectName,
    buildingType,
    location,
    floorArea,
    floors,
    qualityLevel,
    currency: "GHS",
    generatedAt: new Date().toISOString(),
    elements: elementalBreakdown.map(e => ({
      element: e.name,
      cost: e.amount,
      percentage: e.percentage,
      costPerSqm: e.costPerSqm,
    })),
    professionalFees: professionalFees.map(f => ({
      discipline: f.discipline,
      amount: f.amount,
      percentage: f.percentage,
    })),
    contingency,
    escalation,
    totalProjectCost,
    costPerSqm: totalProjectCost / floorArea,
  }
}

export function generateTradePackagesFromElements(
  elementalBreakdown: ElementalCost[],
  floorArea: number,
): TradePackage[] {
  const packageMap: Record<string, { name: string; description: string; unit: string; qtyFactor: number }> = {
    "Substructure": { name: "Earthworks & Foundations", description: "Excavation, concrete foundations, backfill", unit: "m3", qtyFactor: 0.35 },
    "Frame": { name: "Structural Frame", description: "Columns, beams, slabs", unit: "m3", qtyFactor: 0.25 },
    "Upper Floors": { name: "Upper Floor Construction", description: "Floor slabs, stairs", unit: "m2", qtyFactor: 0.9 },
    "Roof": { name: "Roofing Works", description: "Roof structure, covering, gutters", unit: "m2", qtyFactor: 1.0 },
    "External Walls": { name: "External Walls & Cladding", description: "Masonry, rendering, painting", unit: "m2", qtyFactor: 1.5 },
    "Windows & Doors": { name: "Windows & Doors", description: "Frames, glazing, ironmongery", unit: "nr", qtyFactor: 0.15 },
    "Internal Finishes": { name: "Internal Finishes", description: "Flooring, walls, ceilings, paint", unit: "m2", qtyFactor: 2.5 },
    "External Finishes": { name: "External Finishes", description: "External paint, paving, landscaping", unit: "m2", qtyFactor: 0.3 },
    "Fittings": { name: "Fittings & Fixtures", description: "Kitchens, bathrooms, built-in furniture", unit: "ls", qtyFactor: 1 },
    "Mechanical": { name: "Mechanical Services (MEP)", description: "Plumbing, HVAC, fire protection", unit: "ls", qtyFactor: 1 },
    "Electrical": { name: "Electrical Services", description: "Wiring, distribution, lighting", unit: "ls", qtyFactor: 1 },
    "Fire Protection": { name: "Fire Protection Systems", description: "Detection, suppression, escape routes", unit: "ls", qtyFactor: 1 },
  }

  return elementalBreakdown.map((e, i) => {
    const pkg = packageMap[e.name] ?? { name: e.name, description: `${e.name} works`, unit: "ls", qtyFactor: 1 }
    const qty = Math.round(floorArea * pkg.qtyFactor * 100) / 100
    const rate = qty > 0 ? Math.round(e.amount / qty) : 0

    return {
      id: `TP-${String(i + 1).padStart(3, "0")}`,
      name: pkg.name,
      description: pkg.description,
      estimatedCost: e.amount,
      costPerSqm: e.costPerSqm,
      unit: pkg.unit,
      quantity: qty,
      rate,
      element: e.name,
    }
  })
}
