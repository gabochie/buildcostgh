import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

type ContractorInput = {
  id?: string
  name: string
  slug?: string
  title?: string | null
  phone: string
  whatsapp?: string | null
  email?: string | null
  website?: string | null
  description: string
  specialties?: string[]
  yearsOfExperience?: number
  verified?: boolean
  insurance?: string | null
  licenseInfo?: string | null
  rating?: number
  reviewCount?: number
  portfolioImages?: string[]
  logo?: string | null
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
  mwhBuildingClass?: string | null
  mwhCivilClass?: string | null
  mwhElectricalClass?: string | null
  mwhPlumbingClass?: string | null
  mrhRoadClass?: string | null
  classificationSource?: string | null
  classificationVerifiedAt?: string | null
  classificationExpiry?: string | null
  classificationNotVerified?: boolean
  projectScale?: string | null
  googleRating?: number | null
  googleReviewCount?: number | null
  googleLastChecked?: string | null
  socialProfiles?: Record<string, string>
  verificationLevel?: number
  dataConfidence?: number
  lastVerifiedAt?: string | null
  nextVerificationAt?: string | null
  featured?: boolean
  sponsored?: boolean
  status?: string
  regions?: string[]
  sources?: { tier?: string; label: string; url?: string | null; confidence?: number; lastVerifiedAt?: string | null }[]
  projects?: { name: string; type?: string | null; location?: string | null; year?: number | null; value?: number | null; description?: string | null; imageUrl?: string | null; sort?: number }[]
}

export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const contractors = await prisma.contractor.findMany({
    include: {
      regions: { include: { region: true } },
      sources: true,
      projects: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(contractors)
}

type CleanContractorInput = Omit<ContractorInput, "regions" | "sources" | "projects">

// Strip undefined / null-sensitive fields so Prisma doesn't choke on
// unset optional fields sent from the admin form.
function sanitizeInput(body: ContractorInput) {
  const { regions, sources, projects, ...data } = body

  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    if (key === "slug" && !value) continue
    clean[key] = value
  }

  // Date fields arrive as ISO strings from the form; null means "clear it".
  for (const dateField of [
    "classificationVerifiedAt",
    "classificationExpiry",
    "googleLastChecked",
    "lastVerifiedAt",
    "nextVerificationAt",
  ]) {
    if (dateField in clean && clean[dateField] === null) {
      clean[dateField] = null
    }
  }

  return { data: clean as CleanContractorInput, regions, sources, projects }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = (await req.json()) as ContractorInput
  const { data, regions: regionNames, sources, projects } = sanitizeInput(body)

  const slug =
    (data.slug as string) ||
    (data.name as string).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

  const contractor = await prisma.contractor.create({
    data: {
      ...data,
      slug,
      sources: sources?.length
        ? { create: sources.map((s) => ({ tier: s.tier || "secondary", label: s.label, url: s.url, confidence: s.confidence ?? 50 })) }
        : undefined,
      projects: projects?.length
        ? { create: projects.map((p) => ({ name: p.name, type: p.type, location: p.location, year: p.year, value: p.value, description: p.description, imageUrl: p.imageUrl, sort: p.sort ?? 0 })) }
        : undefined,
    },
  })

  if (regionNames?.length) {
    const regions = await prisma.region.findMany({ where: { name: { in: regionNames } } })
    for (const region of regions) {
      await prisma.contractorRegion.create({
        data: { contractorId: contractor.id, regionId: region.id },
      })
    }
  }

  return NextResponse.json(contractor, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = (await req.json()) as ContractorInput
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const { data, regions: regionNames, sources, projects } = sanitizeInput(body)

  const contractor = await prisma.contractor.update({
    where: { id: body.id },
    data: {
      ...data,
      sources: sources
        ? {
            deleteMany: {},
            create: sources.map((s) => ({
              tier: s.tier || "secondary",
              label: s.label,
              url: s.url,
              confidence: s.confidence ?? 50,
            })),
          }
        : undefined,
      projects: projects
        ? {
            deleteMany: {},
            create: projects.map((p) => ({
              name: p.name,
              type: p.type,
              location: p.location,
              year: p.year,
              value: p.value,
              description: p.description,
              imageUrl: p.imageUrl,
              sort: p.sort ?? 0,
            })),
          }
        : undefined,
    },
  })

  if (regionNames) {
    await prisma.contractorRegion.deleteMany({ where: { contractorId: body.id } })
    const regions = await prisma.region.findMany({ where: { name: { in: regionNames } } })
    for (const region of regions) {
      await prisma.contractorRegion.create({
        data: { contractorId: body.id, regionId: region.id },
      })
    }
  }

  return NextResponse.json(contractor)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  await prisma.contractor.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
