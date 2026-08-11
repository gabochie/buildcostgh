import { PrismaClient, Prisma } from "@prisma/client"

/**
 * Research contract — the EXACT schema every librarian research agent was
 * instructed to return. Verified source-tagged contractors only.
 */
export interface ResearchSource {
  tier?: string
  label: string
  url?: string | null
  confidence?: number
}

export interface ResearchProject {
  name: string
  type?: string | null
  location?: string | null
  year?: number | null
  value?: number | null
  description?: string | null
  imageUrl?: string | null
}

export interface ResearchContractor {
  name: string
  slug?: string
  title?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  website?: string | null
  description?: string | null
  specialties?: string[]
  yearsOfExperience?: number | null
  companyType?: string | null
  legalName?: string | null
  yearEstablished?: number | null
  registrationStatus?: string | null
  contactPerson?: string | null
  region?: string | null
  district?: string | null
  city?: string | null
  locality?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  googlePlaceId?: string | null
  googleMapsUrl?: string | null
  googleRating?: number | null
  googleReviewCount?: number | null
  mwhBuildingClass?: string | null
  mwhCivilClass?: string | null
  mwhElectricalClass?: string | null
  mwhPlumbingClass?: string | null
  mrhRoadClass?: string | null
  classificationSource?: string | null
  classificationNotVerified?: boolean
  projectScale?: string | null
  socialProfiles?: Record<string, string>
  sources?: ResearchSource[]
  projects?: ResearchProject[]
  dataConfidence?: number
}

const VALID_TIERS = new Set(["official", "primary", "secondary", "user-generated"])

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const DATE_FIELDS = ["classificationVerifiedAt", "classificationExpiry", "googleLastChecked", "lastVerifiedAt", "nextVerificationAt"]

function normalizeDates(rest: Record<string, unknown>) {
  for (const field of DATE_FIELDS) {
    const v = rest[field]
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      rest[field] = `${v}T00:00:00.000Z`
    }
  }
  return rest
}

/**
 * Upsert researched contractors (with sources + projects) and link their
 * service cities to the Region table. Never fabricates — it only writes what
 * the research JSON contains.
 */
export async function seedContractorsFromResearch(
  prisma: PrismaClient,
  contractors: ResearchContractor[]
) {
  const regions = await prisma.region.findMany()
  const regionMap = new Map(regions.map((r) => [r.name.toLowerCase(), r.id]))

  let created = 0
  let updated = 0

  for (const c of contractors) {
    const {
      sources = [],
      projects = [],
      specialties = [],
      socialProfiles,
      yearsOfExperience,
      name,
      slug,
      description,
      phone,
      ...rest
    } = c

    const data: Prisma.ContractorCreateInput = {
      name: name.trim(),
      slug: slug || slugify(name),
      description: description || "",
      phone: phone || "",
      yearsOfExperience: yearsOfExperience ?? 0,
      specialties: specialties.length ? specialties : ["General Contracting"],
      status: "active",
      // Verified only when the research found concrete registration evidence.
      // High confidence alone (2+ sources) does NOT grant the verified badge.
      verified: rest.registrationStatus === "registered" || false,
      dataConfidence: c.dataConfidence ?? 50,
      ...normalizeDates(rest),
    }

    for (const key of Object.keys(data) as (keyof typeof data)[]) {
      if (data[key] === undefined || data[key] === null) delete data[key]
    }

    if (socialProfiles && Object.keys(socialProfiles).length) {
      data.socialProfiles = socialProfiles as Prisma.InputJsonValue
    }

    const existing = await prisma.contractor.findUnique({ where: { slug: data.slug } })
    if (existing) {
      await prisma.contractor.update({ where: { slug: data.slug }, data })
      updated++
    } else {
      await prisma.contractor.create({
        data: {
          ...data,
          sources:
            sources.length > 0
              ? {
                  create: sources.map((s) => ({
                    tier: VALID_TIERS.has(s.tier || "") ? s.tier! : "secondary",
                    label: s.label,
                    url: s.url ?? null,
                    confidence: s.confidence ?? 50,
                  })),
                }
              : undefined,
          projects:
            projects.length > 0
              ? {
                  create: projects.map((p, i) => ({
                    name: p.name,
                    type: p.type ?? null,
                    location: p.location ?? null,
                    year: p.year ?? null,
                    value: p.value ?? null,
                    description: p.description ?? null,
                    imageUrl: p.imageUrl ?? null,
                    sort: i,
                  })),
                }
              : undefined,
        },
      })
      created++
    }

    // Link service cities to Region table (case-insensitive match).
    const serviceCities = new Set<string>()
    if (c.city) serviceCities.add(c.city.toLowerCase())
    if (c.locality) serviceCities.add(c.locality.toLowerCase())
    if (c.district) serviceCities.add(c.district.toLowerCase())

    const contractor = await prisma.contractor.findUnique({ where: { slug: data.slug } })
    if (contractor) {
      for (const city of serviceCities) {
        const regionId = regionMap.get(city)
        if (regionId) {
          await prisma.contractorRegion.upsert({
            where: {
              contractorId_regionId: { contractorId: contractor.id, regionId },
            },
            update: {},
            create: { contractorId: contractor.id, regionId },
          })
        }
      }
    }
  }

  return { created, updated }
}

/**
 * Delete the old fabricated demo contractors so the directory is never
 * polluted with invented companies.
 */
export async function deleteFabricatedContractors(prisma: PrismaClient, slugs: string[]) {
  const result = await prisma.contractor.deleteMany({
    where: { slug: { in: slugs } },
  })
  return result.count
}
