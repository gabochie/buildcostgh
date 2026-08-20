import { PrismaClient, PermitRequirement, Authority } from '@prisma/client'

const prisma = new PrismaClient()

export interface PermitChecklistInput {
  buildingCategorySlug: string
  buildingSubtypeSlug?: string
  location: string
  floorArea: number
  floors: number
  developmentType?: 'new' | 'renovation' | 'extension'
}

export interface PermitItem {
  name: string
  description: string | null
  status: 'required' | 'likely' | 'conditional' | 'verify'
  authority: string | null
  source: string | null
  notes: string | null
}

export interface PermitChecklistResult {
  location: string
  region: string | null
  buildingCategory: string
  authority: Authority | null
  requirements: PermitItem[]
  disclaimer: string
}

function matchesAppliesTo(
  appliesTo: Record<string, unknown>,
  input: PermitChecklistInput,
  categorySlug: string,
): boolean {
  // Universal requirement
  if (appliesTo.allBuildingTypes) return true

  // Check building category match
  const cats = appliesTo.buildingCategories as string[] | undefined
  if (cats && cats.length > 0 && !cats.includes(categorySlug)) return false

  // Check minimum area
  const minArea = appliesTo.minArea as number | undefined
  if (minArea && input.floorArea < minArea) return false

  // Check minimum floors
  const minFloors = appliesTo.minFloors as number | undefined
  if (minFloors && input.floors < minFloors) return false

  // Check development type
  const devType = appliesTo.developmentType as string | undefined
  if (devType && input.developmentType && input.developmentType !== devType) return false

  // If we passed all checks, it applies
  return true
}

export async function generatePermitChecklist(
  input: PermitChecklistInput,
): Promise<PermitChecklistResult> {
  // 1. Fetch all active permit requirements
  const allRequirements = await prisma.permitRequirement.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  // 2. Filter to applicable requirements
  const applicable: PermitItem[] = []
  for (const req of allRequirements) {
    const appliesTo = req.appliesTo as Record<string, unknown>
    if (matchesAppliesTo(appliesTo, input, input.buildingCategorySlug)) {
      applicable.push({
        name: req.name,
        description: req.description,
        status: req.required as PermitItem['status'],
        authority: req.authority,
        source: req.source,
        notes: req.notes,
      })
    }
  }

  // 3. Determine likely authority based on location
  let region: string | null = null
  let authority: Authority | null = null

  // Try to match region from location name
  const allRegions = [
    'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
    'Volta', 'Northern', 'Upper East', 'Upper West', 'Bono',
    'Bono East', 'Ahafo', 'Western North', 'Oti', 'North East', 'Savannah',
  ]
  for (const r of allRegions) {
    if (input.location.toLowerCase().includes(r.toLowerCase())) {
      region = r
      break
    }
  }

  // Map common cities to regions
  if (!region) {
    const cityRegionMap: Record<string, string> = {
      accra: 'Greater Accra', tema: 'Greater Accra', kumasi: 'Ashanti',
      takoradi: 'Western', tamale: 'Northern', 'cape coast': 'Central',
      sunyani: 'Bono', ho: 'Volta', koforidua: 'Eastern',
      bolgatanga: 'Upper East', wa: 'Upper West',
    }
    const cityLower = input.location.toLowerCase()
    for (const [city, reg] of Object.entries(cityRegionMap)) {
      if (cityLower.includes(city)) { region = reg; break }
    }
  }

  // Find the primary MMDA for the region
  if (region) {
    authority = await prisma.authority.findFirst({
      where: { region, type: 'MMDA', isActive: true },
      orderBy: { name: 'asc' },
    })
  }

  return {
    location: input.location,
    region,
    buildingCategory: input.buildingCategorySlug,
    authority,
    requirements: applicable,
    disclaimer: 'BuildCostGH provides planning and informational guidance. Building permit requirements, fees, approvals and procedures can vary by jurisdiction, project characteristics and applicable regulations. Users must verify current requirements with the relevant Ghanaian authority and qualified professionals before submitting an application or commencing construction.',
  }
}
